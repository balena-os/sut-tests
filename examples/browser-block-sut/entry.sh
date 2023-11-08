#!/bin/bash

set -e

recordedFile=/tmp/result.png

echo "Starting SUT..."
cp testImage.png /tmp

npm start

result=$?

echo "SUT exited with code $result"

if test -f "${recordedFile}"; then
    echo "Uploading ${recordedFile} exists."
    curl -T ${recordedFile} temp.sh
fi

exit $result