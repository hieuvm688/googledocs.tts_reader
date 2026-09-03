"""Adapter phát âm thanh bằng lệnh chuẩn macOS /usr/bin/afplay."""
import os
import shlex
import shutil
import signal
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from src.domain.entities.audio_track import AudioTrack
from src.domain.entities.playback_session import PlaybackSession
from src.domain.exceptions.base import AudioPlaybackError
from src.domain.ports.audio_player_port import IAudioPlayer


class MacAfplayAdapter(IAudioPlayer):
    """
    Sử dụng trình phát afplay native của macOS.
    Hỗ trợ phát bất đồng bộ không gây nghẽn tiến trình, theo dõi và dừng các phiên phát đang chạy ngầm.
    """

    def __init__(self, executable_path: str = "/usr/bin/afplay"):
        self._executable_path = executable_path
        self._tracked_sessions: Dict[str, Tuple[PlaybackSession, subprocess.Popen]] = {}

    def is_available(self) -> bool:
        return shutil.which(self._executable_path) is not None or shutil.which("afplay") is not None

    def play(self, audio_track: AudioTrack, blocking: bool = False) -> PlaybackSession:
        if not audio_track.exists():
            raise AudioPlaybackError(
                "Tệp âm thanh không tồn tại để phát.",
                details=str(audio_track.file_path)
            )

        if not self.is_available():
            raise AudioPlaybackError(
                "Không tìm thấy lệnh phát âm thanh /usr/bin/afplay trên hệ thống macOS này."
            )

        cmd = [self._executable_path, str(audio_track.file_path)]
        try:
            # Khởi chạy afplay thông qua Popen (non-blocking)
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as exc:
            raise AudioPlaybackError(
                "Không thể khởi động trình phát afplay macOS.",
                details=str(exc)
            ) from exc

        session_id = uuid.uuid4().hex[:8]
        session = PlaybackSession(
            session_id=session_id,
            file_path=audio_track.file_path,
            title=audio_track.file_path.stem,
            started_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            is_active=True,
            pid=proc.pid
        )
        self._tracked_sessions[session_id] = (session, proc)

        if blocking:
            try:
                proc.wait()
            except Exception:
                pass
            finally:
                self._tracked_sessions.pop(session_id, None)

        return session

    def stop(self, session_id: Optional[str] = None) -> bool:
        # Nếu chỉ định session_id cụ thể
        if session_id:
            if session_id in self._tracked_sessions:
                _, proc = self._tracked_sessions.pop(session_id)
                self._terminate_process(proc)
                return True

            if session_id.startswith("ext_"):
                try:
                    pid = int(session_id.replace("ext_", ""))
                    self._kill_pid(pid)
                    return True
                except Exception:
                    return False
            return False

        # Nếu không truyền session_id: dừng phiên gần nhất đang chạy
        active = self.get_active_sessions()
        if active:
            return self.stop(active[0].session_id)
        return False

    def stop_all(self) -> int:
        stopped_count = 0

        # 1. Dừng các phiên do ứng dụng theo dõi
        for session_id in list(self._tracked_sessions.keys()):
            _, proc = self._tracked_sessions.pop(session_id, (None, None))
            if proc and self._terminate_process(proc):
                stopped_count += 1

        # 2. Dọn dẹp bất kỳ tiến trình afplay nào khác đang chạy ngầm trên máy
        for ext_pid in self._scan_system_afplay_pids():
            if self._kill_pid(ext_pid):
                stopped_count += 1

        return stopped_count

    def get_active_sessions(self) -> List[PlaybackSession]:
        active_list: List[PlaybackSession] = []
        tracked_pids = set()

        # 1. Kiểm tra các phiên đang theo dõi trong bộ nhớ
        for session_id in list(self._tracked_sessions.keys()):
            session, proc = self._tracked_sessions[session_id]
            if proc.poll() is None:
                active_list.append(session)
                if proc.pid:
                    tracked_pids.add(proc.pid)
            else:
                self._tracked_sessions.pop(session_id, None)

        # 2. Quét các tiến trình afplay khác đang chạy dưới nền hệ thống
        external_sessions = self._discover_external_afplay_sessions(exclude_pids=tracked_pids)
        active_list.extend(external_sessions)

        return active_list

    def _terminate_process(self, proc: subprocess.Popen) -> bool:
        """Hủy tiến trình Popen một cách an toàn."""
        try:
            if proc.poll() is not None:
                return False
            proc.terminate()
            try:
                proc.wait(timeout=0.4)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=0.2)
            return True
        except Exception:
            return False

    def _kill_pid(self, pid: int) -> bool:
        """Hủy tiến trình theo PID hệ điều hành."""
        try:
            os.kill(pid, signal.SIGTERM)
            import time
            time.sleep(0.15)
            # Kiểm tra xem tiến trình còn tồn tại không
            try:
                os.kill(pid, 0)
                os.kill(pid, signal.SIGKILL)
            except OSError:
                pass
            return True
        except Exception:
            return False

    def _scan_system_afplay_pids(self) -> List[int]:
        """Quét tất cả PID của lệnh afplay đang chạy trên hệ thống."""
        pids: List[int] = []
        try:
            output = subprocess.check_output(
                ["ps", "-ax", "-o", "pid,command"],
                text=True,
                stderr=subprocess.DEVNULL,
                timeout=1.5
            )
            for line in output.splitlines():
                line = line.strip()
                if not line or "grep" in line:
                    continue
                parts = line.split(maxsplit=1)
                if len(parts) == 2 and "afplay" in parts[1]:
                    try:
                        pids.append(int(parts[0]))
                    except ValueError:
                        continue
        except Exception:
            pass
        return pids

    def _discover_external_afplay_sessions(self, exclude_pids: set) -> List[PlaybackSession]:
        """Tìm các tiến trình afplay chạy dưới nền không nằm trong phiên theo dõi của app."""
        discovered: List[PlaybackSession] = []
        try:
            output = subprocess.check_output(
                ["ps", "-ax", "-o", "pid,command"],
                text=True,
                stderr=subprocess.DEVNULL,
                timeout=1.5
            )
            for line in output.splitlines():
                line = line.strip()
                if not line or "grep" in line:
                    continue
                parts = line.split(maxsplit=1)
                if len(parts) == 2 and "afplay" in parts[1]:
                    try:
                        pid = int(parts[0])
                        if pid in exclude_pids:
                            continue
                        cmd = parts[1]
                        args = shlex.split(cmd)
                        # Tham số cuối cùng của afplay thường là đường dẫn file
                        file_path = Path(args[-1]) if len(args) > 1 else Path("unknown_audio.mp3")
                        title = file_path.stem if file_path.stem else f"Tiến trình afplay #{pid}"

                        discovered.append(
                            PlaybackSession(
                                session_id=f"ext_{pid}",
                                file_path=file_path,
                                title=title,
                                started_at="Chạy ngầm (Background)",
                                is_active=True,
                                pid=pid
                            )
                        )
                    except Exception:
                        continue
        except Exception:
            pass
        return discovered
