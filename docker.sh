#!/usr/bin/env -S bash -e

_yellow="\e[4;93m"
_nc="\e[0m"
_build=📦
_start="▶️ "

echo -e "${_build} ${_yellow}Building${_nc}:\n"
./Dockerfile

echo -e "\n${_start} ${_yellow}Starting${_nc}:\n"
docker container rm --force censorbot > /dev/null 2>&1
docker container run --rm --name censorbot --publish 8011:8011 --env TZ=America/Chicago --detach censorbot
