#!/usr/bin/env bash
# Khởi chạy giao diện Web React local cho Google Docs TTS Reader
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Tự động giải phóng cổng 8000 nếu đang có phiên bản cũ chạy ngầm
OLD_PID=$(lsof -ti :8000)
if [ -n "$OLD_PID" ]; then
    echo "⚠️ Đang giải phóng cổng 8000 từ tiến trình cũ (PID: $OLD_PID)..."
    kill -9 $OLD_PID 2>/dev/null
    sleep 0.5
fi

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python3 main.py web "$@"
