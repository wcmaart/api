#!/bin/sh

export HOME=/home/ubuntu

cd /usr/local/wcma/projects/api

yarn
pm2 restart "api"
