# Running a test container on a DUT

This example demonstrates a test case where a test container (named SUT) is run alongside the application logic being tested on a device under test. In this particular example, its the browser block.

## To use

- Push a "test release" from this folder to the fleet containing the DUT
- Then, go to the root directory of this `sut-test` project, and run `node index.js -f <fleet with DUT>/-t <DUT uuid> , -r <test fleet release>`
- That script will pin your DUT to the fleet release that will cause it to run the test container (SUT) alongside the application logic, and collect the result. 