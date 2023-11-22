# Autokit based test container example

This folder contains a skeleton test container that can be run on an autokit to provision a DUT to a target fleet.

You can modify `entry.sh` so that after provisioning, it either:

1. pins the DUT to a test release with an SUT on it, and collect those results and propgate them back to the client
2. pins the DUT to a test release and then run tests from the autokit
