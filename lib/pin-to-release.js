const { getSdk } = require('balena-sdk');
const { BalenaCloudInteractor } = require('./balena');
const retry = require('async-retry');
require('dotenv').config();



async function pinDut(release, dutUuid){
    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);
    await Cloud.sdk.models.device.pinToRelease(dutUuid, release);
    const releaseId = (await Cloud.sdk.models.release.get(release)).id;

    // wait until the device is running that release
    
    await retry(
        async () => {
          // if anything throws, we retry
          // check "running  release" property
          let device = await Cloud.sdk.models.device.get(dutUuid);

          if (device.is_running__release.__id !== releaseId){
           console.log(`waiting for device to run release: ${release}...`)
           throw new Error(`Device still not running target release: ${release}`);
          }
        },
        {
          retries: 20,
          minTimeout: 10 * 1000
        }
    );

    console.log(`Device ${dutUuid} successfully running release: ${release}`)
}

module.exports = { pinDut }