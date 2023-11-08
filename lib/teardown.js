const { BalenaCloudInteractor } = require('./balena');
require('dotenv').config();


async function teardown(dutUUid){
    // remove busy status
    try {
        const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
        await Cloud.authenticate(process.env.BALENA_API_KEY);

        await Cloud.sdk.models.device.tags.set(dutUUid, 'busy', 'false');
    } catch(e){
        console.log(e.message)
    }
}

module.exports = { teardown }