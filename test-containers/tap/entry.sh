#!/bin/bash
echo "### TEST START $TEST_ID ###"
 
./node_modules/.bin/tap run --allow-empty-coverage --reporter=tap > /tmp/results.log

exit=$(echo $?)

cat /tmp/results.log

echo "### TEST RESULT $TEST_ID $exit ###"