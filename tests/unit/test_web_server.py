"""Unit tests cho Web Server Presentation layer."""
import pytest
from aiohttp.test_utils import TestClient, TestServer
from src.presentation.web.web_server import build_web_app

@pytest.mark.asyncio
async def test_health_endpoint():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/api/health")
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "ok"

@pytest.mark.asyncio
async def test_get_voices_endpoint():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/api/voices?locale=vi")
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "success"
        assert len(data["data"]) >= 2
        voice_ids = [v["voice_id"] for v in data["data"]]
        assert "vi-VN-HoaiMyNeural" in voice_ids

@pytest.mark.asyncio
async def test_post_read_empty_body():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post("/api/read", json={"source": ""})
        assert resp.status == 400
        data = await resp.json()
        assert data["status"] == "error"

@pytest.mark.asyncio
async def test_index_page():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/")
        assert resp.status == 200
        text = await resp.text()
        assert "Google Docs TTS Reader" in text

@pytest.mark.asyncio
async def test_post_read_raw_text():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        resp = await client.post(
            "/api/read",
            json={
                "type": "text",
                "source": "Xin chào, đây là bài test tự động cho web.",
                "voice": "vi-VN-HoaiMyNeural",
                "rate": "+0%",
                "play_mac": False
            }
        )
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "success"
        res = data["data"]
        assert "Xin chào" in res["document_title"]
        assert res["character_count"] > 0
        assert res["word_count"] > 0
        assert res["audio_url"].startswith("/api/audio/")

        # Kiểm tra endpoint tải file audio vừa tạo
        audio_resp = await client.get(res["audio_url"])
        assert audio_resp.status == 200
        assert audio_resp.headers["Content-Type"] == "audio/mpeg"

from aiohttp import FormData
from pathlib import Path

@pytest.mark.asyncio
async def test_post_read_file_upload():
    sample_file = Path("docx/sample_document.docx")
    if not sample_file.exists():
        pytest.skip("Không tìm thấy tệp docx/sample_document.docx")

    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        form = FormData()
        form.add_field(
            "file",
            open(sample_file, "rb"),
            filename="sample_document.docx",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        form.add_field("voice", "vi-VN-HoaiMyNeural")
        form.add_field("rate", "+0%")
        form.add_field("play_mac", "false")

        resp = await client.post("/api/read", data=form)
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "success"
        res = data["data"]
        assert res["word_count"] > 0
        assert res["audio_url"].startswith("/api/audio/")

@pytest.mark.asyncio
async def test_library_and_delete_endpoints():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        # Lấy danh sách library
        resp = await client.get("/api/library")
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "success"
        assert isinstance(data["data"], list)

        # Thử gọi delete cho file không tồn tại -> 404
        del_resp = await client.delete("/api/audio/non_existent_file.mp3")
        assert del_resp.status == 404

@pytest.mark.asyncio
async def test_stop_endpoint():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        # Stop một job không tồn tại -> 404 hoặc stopped
        resp = await client.post("/api/stop", json={"job_id": "fake_job_123"})
        assert resp.status in [200, 404]

@pytest.mark.asyncio
async def test_playback_endpoints():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        # 1. Lấy danh sách sessions ban đầu
        resp = await client.get("/api/playback/sessions")
        assert resp.status == 200
        data = await resp.json()
        assert data["status"] == "success"
        assert isinstance(data["data"], list)

        # 2. Stop non-existent session
        stop_resp = await client.post("/api/playback/stop", json={"session_id": "non_existent_sess"})
        assert stop_resp.status == 404

        # 3. Stop all playbacks
        stop_all_resp = await client.post("/api/playback/stop-all")
        assert stop_all_resp.status == 200
        all_data = await stop_all_resp.json()
        assert all_data["status"] == "success"
        assert "stopped_count" in all_data

        # 4. Play mac with non-existent file -> 404
        play_resp = await client.post("/api/play-mac", json={"filename": "non_existent.mp3"})
        assert play_resp.status == 404

@pytest.mark.asyncio
async def test_rename_audio_endpoint():
    app = build_web_app()
    async with TestClient(TestServer(app)) as client:
        # 1. Rename file không tồn tại -> 404
        resp = await client.post("/api/audio/non_existent.mp3/rename", json={"new_title": "Tên Mới"})
        assert resp.status == 404

        # 2. Rename với title rỗng -> 400
        resp_empty = await client.post("/api/audio/fake.mp3/rename", json={"new_title": "  "})
        assert resp_empty.status in [400, 404]

        # 3. Tạo một file mp3 giả trong OUTPUT_AUDIO_DIR
        from src.presentation.web.web_server import OUTPUT_AUDIO_DIR
        test_file = OUTPUT_AUDIO_DIR / "test_rename_sample.mp3"
        test_file.write_bytes(b"dummy mp3 data")

        try:
            # Gọi API đổi tên
            rename_resp = await client.post(
                f"/api/audio/{test_file.name}/rename",
                json={"new_title": "Bản Thu Kiểm Thử Đổi Tên"}
            )
            assert rename_resp.status == 200
            res_data = await rename_resp.json()
            assert res_data["status"] == "success"
            assert res_data["data"]["title"] == "Bản Thu Kiểm Thử Đổi Tên"

            # Kiểm tra API library trả về tiêu đề mới
            lib_resp = await client.get("/api/library")
            assert lib_resp.status == 200
            lib_data = await lib_resp.json()
            matched = [item for item in lib_data["data"] if item["filename"] == test_file.name]
            assert len(matched) == 1
            assert matched[0]["title"] == "Bản Thu Kiểm Thử Đổi Tên"
        finally:
            # Dọn dẹp file test
            if test_file.exists():
                await client.delete(f"/api/audio/{test_file.name}")
