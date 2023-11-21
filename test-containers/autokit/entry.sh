#!/bin/sh
modprobe sg
env

echo "### TEST START $TEST_ID ###"
 
#node ./build/index.js > results.log

## needs api key
node ./sut-tests/index.js

exit=$(echo $?)

cat /tmp/results.log

echo "### TEST RESULT $TEST_ID $exit ###"
