const { BalenaCloudInteractor } = require('./balena');
const retry = require('async-retry');
require('dotenv').config();


async function search(appName){

    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);

    return retry(
        async () => {
            // find a DUT
            console.log(`Searching for idle device`)
            let devices = await Cloud.selectDevicesWithTag(appName, 'DUT', 'true');
            // fails here if there are no idle devices - must retry
            if(devices.length === 0){
                throw new Error(`No devices with DUT tag found!`)
            }

            // find a non-busy one
            // need to find a device from "devices" with busy = false
            for(let i in devices){
                if(devices[i].tags.busy !== 'false'){
                    devices.splice(index, 1)
                }
            }

            if(devices.length === 0){
                throw new Error(`No idle devices found!`)
            }
            
            const selectedDevice = devices[0].deviceId;
            // add busy tag to reserve
            await Cloud.sdk.models.device.tags.set(selectedDevice, 'busy', 'true');

            return (await Cloud.sdk.models.device.get(selectedDevice)).uuid
        },
        {
            retries: 20,
            minTimeout: 10 * 1000
        }
    )
}

module.exports = { search }