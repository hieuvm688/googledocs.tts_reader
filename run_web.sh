#!/usr/bin/env bash
# Khởi chạy giao diện Web React local cho Google Docs TTS Reader
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

python3 main.py web "$@"
