#!/usr/bin/env bash

set -e

npm run build
docker build --progress=plain -t tonybogdanov/drop:latest .
docker push tonybogdanov/drop:latest

#docker run --rm -p 3000:3000 tonybogdanov/drop:latest
kubectl rollout restart deployment -n tonybogdanov drop
