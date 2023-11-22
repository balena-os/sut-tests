#!/bin/sh

# Required to load sg driver used for the SD mux
modprobe sg

echo "### TEST START $TEST_ID ###"

# Provision a device 
node ./build/index.js >> /tmp/results.log

# Get UUID of device
UUID=$(cat /tmp/uuid)

# 2 minute wait for DUT to be available in dasboard - TODO - replace this with polling via sdk to see if online status
sleep 2m

# Put tests here - if you want to run SUT on DUT, run client again to pin DUT to SUT release
node ./sut-tests/index.js -t "$UUID" -r "$RELEASE" >> /tmp/results.log

# Otherwise just pin the DUT then run the tests you want
## ./run-test.sh

exit=$(echo $?)

cat /tmp/results.log

# Todo - add a teardown that removes the provisioned DUT, as otherwise it will fill up the app

echo "### TEST RESULT $TEST_ID $exit ###"
