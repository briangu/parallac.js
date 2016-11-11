#!/bin/sh

function join_by { local IFS="$1"; shift; echo "$*"; }

HOSTS=()
UPPER_COUNT=${1-1}
UPPER_PORT=$((3000+$UPPER_COUNT))
for i in `seq 3000 $UPPER_PORT`;
do
    HOSTS+=("http://localhost:$i")
done

export PARALLAC_SERVERS=`join_by , ${HOSTS[@]}`

echo PARALLAC_SERVERS=$PARALLAC_SERVERS

for i in `seq 3000 $UPPER_PORT`;
do
    node server/server.js "http://localhost:$i" &
done

