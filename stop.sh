#!/bin/bash

[ -f ${PID_FILE} ] && kill -TERM $(cat ${PID_FILE})
