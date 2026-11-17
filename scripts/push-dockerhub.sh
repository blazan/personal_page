#!/usr/bin/env sh
# Push the built image to Docker Hub.
#
#   DOCKERHUB_USER=blazanmaric DOCKERHUB_TOKEN=<token> sh scripts/push-dockerhub.sh
#
# Requires the image to exist locally: docker compose build
set -eu

USER="${DOCKERHUB_USER:?set DOCKERHUB_USER}"
TOKEN="${DOCKERHUB_TOKEN:?set DOCKERHUB_TOKEN (Docker Hub access token, not your password)}"
REPO="${DOCKERHUB_REPO:-marijana-portfolio}"
LOCAL="${LOCAL_IMAGE:-marijana-portfolio:latest}"

# `--password-stdin` keeps the token out of the process list and shell history.
printf '%s' "$TOKEN" | docker login -u "$USER" --password-stdin

docker tag "$LOCAL" "$USER/$REPO:latest"
docker tag "$LOCAL" "$USER/$REPO:1.0.0"

docker push "$USER/$REPO:latest"
docker push "$USER/$REPO:1.0.0"

docker logout
echo "Pushed $USER/$REPO:latest and $USER/$REPO:1.0.0"
