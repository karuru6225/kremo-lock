#!/bin/bash

DIR=$(cd $(dirname $0);pwd)

cat << EOC > /etc/systemd/system/kremo-lock.service
[Unit]
Description=kremo-lock remote lock/unlock entrance key service
After=syslog.target network.target

[Service]
Type=forking
EnvironmentFile=${DIR}/env
ExecStart=${DIR}/start.sh
ExecStop=${DIR}/stop.sh
WorkingDirectory=${DIR}
KillMode=none
Restart=always
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOC

echo "installed kremo-lock.service"
