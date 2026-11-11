#!/bin/bash
# Start the judge web UI (judge-tiervnoj container) on http://localhost:8765
cd "$(dirname "$0")"
docker rm -f judge-web >/dev/null 2>&1
exec docker run -d --name judge-web --restart unless-stopped \
  --cap-add=SYS_PTRACE -p 8765:8765 \
  -v "$PWD":/web:ro -v "$PWD/problems":/problems:ro \
  --entrypoint /usr/bin/tini vnoj/judge-tiervnoj -- bash -c '
    export DMOJ_IN_DOCKER=1 PYTHONUNBUFFERED=1 LANG=C.UTF-8 PYTHONIOENCODING=utf8 PYTHONDONTWRITEBYTECODE=1
    cd /judge && . ~judge/.profile 2>/dev/null
    exec setpriv --reuid judge --regid judge --clear-groups env HOME=/home/judge /env/bin/python3 /web/server.py'
