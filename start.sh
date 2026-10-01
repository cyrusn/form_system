#!/bin/bash
echo "[Remote Start] Launching form-system container..."

# Create database data folder on host if not exists
mkdir -p ./data

docker run -d \
  --name form-system\
  -p 127.0.0.1:4493:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env.production \
  cyrusn/form-system:latest

echo "[Remote Start] Container is running on port 4493!"
