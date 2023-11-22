# Testing using Autokit

In this example, the fleet defined in this folder is pushed to an autokit, in an autokit fleet. 

It will provision a DUT into a fleet of the application you actually want to test - for example, if you want to test browser block, it will provision a DUT into the browser block fleet you have, with a specified OS version you provide. 

## To use

- Push a release to your fleet/application you wish to test - e.g a browser block fleet
- Then push a release (draft) to your autokit fleet - you can specify the release you want to test using the `RELEASE` env var, and the OS version you want to be provisioned using the `VERSION` env var.
- Then, go to the root directory of this `sut-test` project, and run `node index.js -f <autokit fleet>/-t <autokit device uuid> , -r <autokit fleet release>`
- This script will pin your autokit to the fleet release that will cause it to provision the DUT into the target fleet, and then run tests that you specify. 

## Customising / specifying tests

- In the `../../test-containers/autokit` folder, you can customise the autokit container to run any form of test you like, after provisioning the DUT
- You can either:
- Run any test script you want from the autokit container, to perform tests from the "outside" - for example capture video output
- Run the `sut-test` script again from inside the autokit, to pin the newly provisioned DUT to a test release that contains the test container. The results will get propogated back to the original client.


