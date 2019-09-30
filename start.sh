#!/bin/bash

cd `dirname $0`
/root/.nodenv/versions/10.16.3/bin/node main.js &
echo $! > ${PID_FILE}
