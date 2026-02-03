@echo off
REM Local development startup script for PocketBase
REM Uses Cloudflare Turnstile test keys (always pass)

set CF_SECRET_KEY=1x0000000000000000000000000000000AA

echo Starting PocketBase with dev environment...
echo CF_SECRET_KEY is set (Turnstile test key)
echo.
echo Admin UI: http://127.0.0.1:8090/_/
echo.

pocketbase.exe serve
