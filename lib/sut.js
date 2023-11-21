const { getSdk } = require('balena-sdk');
const { BalenaCloudInteractor } = require('./balena');
const retry = require('async-retry');
require('dotenv').config();


async function getLogs(dutUuid, serviceId, testId){
    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);


    await Cloud.sdk.models.device.envVar.set(dutUuid, `TEST_ID`, testId);

     // wait until the device is running that release //263687050
     console.log(`Getting logs for service ${serviceId}...`)
     let logs = await Cloud.sdk.logs.history(dutUuid);
     let testlogs = []
     for(let log of logs){
         if((log.serviceId !==undefined ) && (log.serviceId === serviceId)){
            testlogs.push(log.message)
         }
     }
     //console.log(testlogs)
     // go through test logs and look for test start end - if no end, fail
     let startIndex;
     let endIndex;
     for(let i in testlogs){
        if(testlogs[i].includes(`### TEST START ${testId}`)){
            startIndex = i;
        }

        if(testlogs[i].includes(`### TEST RESULT ${testId}`)){
            endIndex = i
        }
     }

     
    //  console.log(startIndex)
    //  console.log(endIndex)
     if((endIndex !== undefined) && (startIndex !== undefined)){
        // console.log(testlogs)
        testlogs.splice(0, startIndex);
        testlogs.splice(endIndex+1)

        // console.log(testlogs[0]);
        // console.log(testlogs)

        // console.log(testlogs[testlogs.length-1]);
        // console.log(testlogs[testlogs.length-1].match(/-?\b\d+\b/)[0]);
        let exitCode = parseInt(testlogs[testlogs.length-1].match(/-?\b\d+\b/)[0]);
        return { testlogs: testlogs, exitCode: exitCode}
     } else{
        throw new Error(`No test logs yet for TEST_ID ${testId}`)
     }
}

async function waitSut(release, dutUuid, testId){
    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);


    console.log(`Getting state`)
    let services = await Cloud.sdk.models.device.getWithServiceDetails(dutUuid)
    
    // gets service ID of the SUT - this is to filter for the logs
    let id = 0;
    for(let service of services.current_services.sut){
        console.log(service.commit)
        if(service.commit === release){
            id = service.service_id
        }
    }
    //console.log(services.current_services.sut)
    // wait for SUT
    let testlogs;
    await retry(
        async () => {
          // if anything throws, we retry
          // check "running  release" property
          testlogs = await getLogs(dutUuid, id, testId);
        },
        {
          retries: 20,
          minTimeout: 10 * 1000
        }
    );
    
    return testlogs
}


module.exports = { waitSut }