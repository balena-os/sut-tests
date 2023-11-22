# sut-tests

This project contains an MVP / example of how balena cloud fleets/apps/blocks can be tested, also using balena cloud. 

## How it works

This repo contains a client (`index.js`) that does the following:

1. (optionally) finds a device in a target fleet that is idle, and matches a provided tag (or you can just provide a single device explicitly)
2. Marks that device as BUSY - so it isn't then used by another instance of the test client. This is done through balena cloud Tags
3. It pins the device to a specified balena cloud release. This release must be created BEFORE runinng the test client - and must contain a container called "sut"
4. It waits until that device is runinng that specified release
5. It then polls that device for logs from the "sut" container. It waits until that container "finishes" and provides a pass/fail result (see details below)
6. The logs and result are reported by the client. The logs reported are anything that is printed to the SUT container stdout. If the user wants some specific logs only, then can ensure only what they want is reported.

## What is the SUT

The SUT is the "service under test" - it is the container that the test client will monitor to determine a test pass or fail. Any user defined tests can go into this container, it has a single pair of requirements however.

- it must be named `sut` in the docker compose
- Somewhere in this container logic (for example in the entry script), the messages `### TEST START $TEST_ID ###` must be placed before the "test" logic, and `### TEST RESULT $TEST_ID <RESULT> ###` placed after, where `TEST_ID` is an environment variable with that name, and `RESULT` is an integer value representing a pass or fail. The value of `0` is a pass, and anything else is a failure
- The reason for needing the `TEST START` statement is so that we knw when the tests for this particular test run have started. This means tests can be retried or run again, from the same test release. Before tests are run, the client randomly creates a test ID and puts it on the target device via a balena cloud env var. If this didn't exist, it becomes more difficult to determine when a given test run has started (or ended)
- The reason for the test result statement is that we need a "standard" way to report the results. For now this is the simplest method, as we can't get exit codes easily from the SUT container

## How to use

- use node 16 or 18 (e.g `nvm use 16`)
- Run `npm install`
- Push a balena cloud release to the test fleet using `balena push`
- Run `node index.js -f <fleet with DUT>/-t <DUT uuid> , -r <test fleet release>`
- change the name of `.env.example` to `.env` and fill in the API key and balena cloud env.

Check the examples folder to see 2 different scenarios:

- Running tests directly on a DUT
- Running tests on a DUT via an autokit - this enables for example testing your app works on a specified OS version. 
- In the autokit example, tests can be run on the autokit from the "outside" of the DUT - useful when probing the DUT interfaces in some way. Or, the test client can be used from the autokit after provisioning the DUT, to run the first scenario on the newly provisioned device - the results propogate back to the client, its is "daisy chained".

## Why use release pinning

- We are using balena cloud releases and pinning to get test containers to the DUT or autokit as it is the most reliable way to do so at the moment
- it is asynchronous and doesn't require a constant connection to the DUT or autokit
- There are no "hacks" - we are just using balena cloud features as a customer would
- We don't realy on public url, vpn/ssh proxy, which has proven to be unstable in the past.
- The same client and method is used to either run tests on a DUT or via an autokit with no special exceptions 0 as they are both balena cloud devices we need to get a test or testing release to. 

## Integration into CI workflows

It is simple to integrate this thin client into CI workflows, for example within a github action workflow that runs on a PR:

1. Have a deploy to balena action that creates a draft release for the fleet 
2. Have a deploy to balena action that creates the test fleet or autokit - using an alternative `docker-compose.yml`
3. Run the client with balena cloud release from step 2, get a pass fail. If using an autokit, propogate the release from step 1 to the autokit to test.
4. Get the result and pass/fail the checks!
5. If they pass, you can mark the release in step 1 as final
