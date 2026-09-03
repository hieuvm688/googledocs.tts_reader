#!/usr/bin/env python3
"""
Entrypoint của dự án Google Docs Text-to-Speech Reader.
Tuân thủ nghiêm ngặt chuẩn Clean Architecture.
"""
import sys
import os

# Đảm bảo root thư mục có trong sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.presentation.cli.cli_app import main_entrypoint

if __name__ == "__main__":
    main_entrypoint()
