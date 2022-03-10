#!/bin/bash

tag="$1"
if [ -z $tag ]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

imageName="jeffstephens/retention-manager:$tag"

docker buildx create --name mybuilder --use
docker buildx build --push --platform linux/arm/v7,linux/arm64,linux/amd64 . -t $imageName
