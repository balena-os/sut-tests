# Example notes

## SUTDUT 

### Tasks

Build more examples to figure out mechanism, features or improvements we can build.


# Test your app ON the hardware

## Getting Started: CHECK IF TESTS Work
- [python hello world](https://github.com/balena-io-examples/balena-python-hello-world)


### DIFFERENT E2e Web testing - protractor, codecept, Selenium
- [node hello world](https://github.com/balena-io-examples/balena-nodejs-hello-world)
- Steal the dashboard e2e setup
- browser block

## Full appilcation: Database, Backend, Frontend, Visualisation 

- Temperature readings --> Database --> FRONTEND (Grafana)
- Speedtest
- Dashboard

## Advanced: Supervisor

- Memory leaks 
- Supervisor bandwidth or data usage logging https://github.com/balena-io-examples/network-metrics-logger




# Test your app + THE hardware 

## Getting Started: e2e levaithan test
Check if things work

### intermediate: Device "black box" testing

- wifi-connect ( no remote connection to DUT )
- balena-sound


## Advanced: Test app <X> with OS version <Y>

- need autokit 


# Autokit + DUTSUT

- we have browser block SUT, thats used to test changes to browser block
- we wnat to use that same SUT to test a new OS version on the DUT  
- block SUT will

- download os image for new OS version

## Assuming autokit server is running on an autokit

1. from laptop, github etc (thin client location)
2. thin client ssh'es into the autokit, and pulls the SUT
3. the SUT runs:
   1. it downloads an OS image for the target OS version (pre configured - for the production fleet)
   2. it flashes this to the DUT
   3. Powers on the DUT
   4. pins DUT to the release to be tested
   5. waits for DUT to download the correct containers for this release
   6. then runs the tests
4. gets result
