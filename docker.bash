#!/bin/bash
# git update-index --chmod=+x docker.bash

# Setup app version
ENV_FILE="deno.json"
if [ -f "$ENV_FILE" ]; then
  CURRENT_VERSION=$(grep -oP '"version":\s*"\K[0-9]+\.[0-9]+\.[0-9]+' "$ENV_FILE")
  if [ -n "$CURRENT_VERSION" ]; then
    # Parse version parts
    MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
    MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
    PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)
    # Increment patch version
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
    # Update file
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$ENV_FILE"
    echo "Version: $CURRENT_VERSION → $NEW_VERSION"
  fi
fi

# 1. Nginx Config ins Gateway kopieren
cp nginx.conf /mnt/workspace/nginx/conf.d/aztv.conf

# 2. Rebuild container
docker compose down -v
docker compose up --build -d

# 3. Nginx Gateway neu laden
docker exec nginx-gateway nginx -s reload

# 2. Git Commit & Push
if [ -n "$NEW_VERSION" ]; then
  git add -A
  git commit -m "v$NEW_VERSION"
  git push
  echo "Git: v$NEW_VERSION gepusht"
fi