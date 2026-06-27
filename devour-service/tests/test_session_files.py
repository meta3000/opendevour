"""会话文件管理测试。"""

import pytest
from unittest.mock import patch, MagicMock


@pytest.fixture
def temp_sessions_dir(tmp_path):
    """临时会话文件目录。"""
    sessions_dir = tmp_path / "sessions"
    sessions_dir.mkdir()
    with patch("devour_service.services.session_file_service.get_settings") as mock_settings:
        mock_settings.return_value.session_files_dir = str(sessions_dir)
        yield sessions_dir


@pytest.fixture
def service():
    from devour_service.services.session_file_service import SessionFileService
    return SessionFileService()


class TestSessionFileService:
    def test_save_and_read_file(self, temp_sessions_dir, service):
        result = service.save_file("conv-1", "test.md", "# Hello", "report")
        assert result["filename"] == "test.md"
        assert result["file_type"] == "report"
        assert result["size"] > 0

        content = service.read_file("conv-1", "test.md")
        assert content == "# Hello"

    def test_list_files(self, temp_sessions_dir, service):
        service.save_file("conv-2", "a.md", "aaa", "report")
        service.save_file("conv-2", "b.json", "{}", "data")

        files = service.list_files("conv-2")
        assert len(files) == 2
        filenames = {f["filename"] for f in files}
        assert filenames == {"a.md", "b.json"}

    def test_list_files_empty(self, temp_sessions_dir, service):
        files = service.list_files("nonexistent")
        assert files == []

    def test_read_nonexistent_file(self, temp_sessions_dir, service):
        content = service.read_file("conv-1", "nope.txt")
        assert content is None

    def test_delete_file(self, temp_sessions_dir, service):
        service.save_file("conv-3", "del.md", "delete me", "text")
        assert service.delete_file("conv-3", "del.md") is True
        assert service.read_file("conv-3", "del.md") is None

    def test_delete_nonexistent(self, temp_sessions_dir, service):
        assert service.delete_file("conv-3", "nope.txt") is False

    def test_get_session_dir_creates_dir(self, temp_sessions_dir, service):
        d = service.get_session_dir("new-conv")
        assert d.exists()
        assert d.is_dir()
