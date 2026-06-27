#!/usr/bin/env bash
cd "$(dirname "$0")"
PYTHONUNBUFFERED=1 PYTHONPATH=src conda run -n opendevour \
  uvicorn devour_service.main:app --host 0.0.0.0 --port 8000 \
  --reload --reload-dir src/devour_service --reload-exclude 'logs/*' --reload-exclude 'data/*'
