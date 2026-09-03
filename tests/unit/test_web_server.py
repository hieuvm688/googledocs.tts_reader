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
