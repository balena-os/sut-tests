const { getSdk } = require('balena-sdk');
const { BalenaCloudInteractor } = require('./balena');
const retry = require('async-retry');
require('dotenv').config();
// const { exec: Exec } = require('child_process');
const fs = require('fs')
// const util = require('util');
// const exec = util.promisify(Exec);
const path = require('path');

// async function inspectinator(sutContainer, device) {
//     // await retry(
//     // async () => {
//     // if anything throws, we retry
//     // const someInspect = await exec(`echo "balena inspect ${sutContainer} ;exit;" | balena ssh ${device} | tail -n +4`);
//     let someInspect = JSON.parse((await exec(`echo "balena inspect ${sutContainer} | jq '{State: .[].State, Config: .[].Config.Env}' ;exit;"  | balena ssh ${device} | tail -n +4`)).stdout.trim());
//     someInspect.TEST_ID = someInspect.Config.filter(x => x.includes('TEST_ID'))[0].split('=')[1]
//     // console.log(someInspect)
//     // await fs.writeFile(`./before${Date.now()}.txt`, JSON.stringify(someInspect));
//     // }
//     // {
//     //     retries: 20,
//     // }
//     // );
// }

// async function getLogs(dutUuid, serviceId, testId, sutContainerID) {
//     const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
//     await Cloud.authenticate(process.env.BALENA_API_KEY);

//     let pollingInspect = await inspectinator(sutContainerID, dutUuid)

//     if (pollingInspect.TEST_ID === testId) {
//         if (pollingInspect.State.Running) {
//             console.log('SUT is running')
//         } else {
//             console.log(pollingInspect.State.status)
//         }
//     }

//     // wait until the device is running that release //263687050

//     let logs = await Cloud.sdk.logs.history(dutUuid);
//     let testlogs = []
//     for (let log of logs) {
//         if ((log.serviceId !== undefined) && (log.serviceId === serviceId)) {
//             testlogs.push(log.message)
//         }
//     }
//     //console.log(testlogs)
//     // go through test logs and look for test start end - if no end, fail
//     let startIndex;
//     let endIndex;
//     for (let i in testlogs) {
//         if (testlogs[i].includes(`### TEST START ${testId}`)) {
//             startIndex = i;
//         }

//         if (testlogs[i].includes(`### TEST RESULT ${testId}`)) {
//             endIndex = i
//         }
//     }


//     if ((endIndex !== undefined) && (startIndex !== undefined)) {
//         // console.log(testlogs)
//         testlogs.splice(0, startIndex);
//         testlogs.splice(endIndex + 1)

//         let exitCode = parseInt(testlogs[testlogs.length - 1].match(/-?\b\d+\b/)[0]);
//         return { testlogs: testlogs, exitCode: exitCode }
//     } else {
//         console.log(`Nope}`)
//         // throw new Error(`No test logs yet for TEST_ID ${testId}`)
//     }
// }

// async function sutStatusFinder(dutUuid) {
//     let services =

//     // gets service ID of the SUT - this is to filter for the logs;
//     // for (let service of services.current_services.sut) {
//     // console.log(service.commit)
//     // if (service.commit === release) {
//     //     id = service.service_id
//     // }
//     return services.sut[0].status
//     // }

// }

async function streamLogs(testServiceName, testServiceState) {
    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);
    const logsDir = process.env.LOGS_DIR || './testlogs'

    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    const filePath = path.join(logsDir, `${testServiceName}.txt`);
    const logs = fs.createWriteStream(filePath, { flags: 'w', encoding: 'utf8' });

    if (testServiceState.status === "exited") {
        return await new Promise(async (resolve, reject) => {
            console.log(`Starting test container: ${testServiceName}`);
            const stripAnsi = (await import('strip-ansi')).default;
            const detectionString = "### TEST RESULT";
            const deviceLogs = await Cloud.sdk.logs.subscribe(dutUuid);
            await Cloud.sdk.models.device.restartService(dutUuid, testServiceState.image_id);

            deviceLogs.on('line', async function (line) {
                if (line.serviceId === testServiceState.service_id) {
                    const cleanMessage = await stripAnsi(line.message);
                    // console.log(cleanMessage);
                    logs.write(cleanMessage);

                    if (cleanMessage.includes(detectionString)) {
                        const exitCode = parseInt(cleanMessage.match(/-?\b\d+\b/)[0]);
                        console.log(`Received test result: ${cleanMessage}`);
                        resolve({
                                "Test Container": testServiceName,
                                "Test Logs": filePath,
                                "Final Result": exitCode === 0 ? `✅ exit code: ${exitCode}` : `🚫 exit code: ${exitCode}`

                        });
                    }
                }
            });
        });
    } else {
        throw new Error("Some tests still running")
    }
}


async function waitSut(dutUuid) {
    const Cloud = new BalenaCloudInteractor(process.env.BALENA_ENV);
    await Cloud.authenticate(process.env.BALENA_API_KEY);

    // console.log(`Getting state`)

    // wait for SUT
    console.log(`### Beginning test actuals ###`)


    // get the sut container name for inspect
    // const sutContainerID = (await exec(`echo "balena ps -a --format '{{.Names}}' | grep 'sut_' ;exit;" | balena ssh f5c80bb5d82ab1effb305fc232a2bf45 | tail - n + 4`)).stdout.trim()

    // await Cloud.sdk.models.device.envVar.set(dutUuid, `TEST_ID`, testId);
    // const initalInspect = await inspectinator(sutContainerID, dutUuid)
    // await Cloud.sdk.models.device.serviceVar.set(dutUuid, 'browser', `TEST_ID`, `${Math.random().toString(36).substring(2, 10)}`);

    // await new Promise(resolve => setTimeout(resolve, 5000));


    // return retry(
    //     async () => {
    // if anything throws, we retry
    // check "running  release" property
    //     while (true) {
    //         return await getLogs(dutUuid, id, testId, sutContainerID);
    //     }
    // },
    //     {
    //         retries: 200,
    //         maxTimeout: 2000
    //     }
    // );

    // return retry(
    // async () => {

    regex = /^test-.*/
    const current_services = (await Cloud.sdk.models.device.getWithServiceDetails(dutUuid)).current_services
    const testServices = Object.keys(current_services).filter(x => regex.test(x))

    return await Promise.all(testServices.map(async (testService) => {
        const testServiceState = current_services[testService][0]
        return await streamLogs(testService, testServiceState)
    }))

    // return await retry(await streamLogs(testService, testServiceState), { retries: 3, maxTimeout: 5000 })
}


    // const service_id = (await Cloud.sdk.models.device.getWithServiceDetails(dutUuid)).current_services.sut[0]

    // if ((await Cloud.sdk.models.device.getWithServiceDetails(dutUuid)).current_services.sut[0].status === "exited") {
    //     return await new Promise(async (resolve, reject) => {
    //         console.log("Starting new Test")
    //         const deviceLogs = await Cloud.sdk.logs.subscribe(dutUuid)
    //         // Easiest Way to Start a service
    //         await Cloud.sdk.models.device.serviceVar.set(dutUuid, 'sut', `TEST_ID`, testId);

    //         deviceLogs.on('line', async function (line) {
    //             // logCatcher.push(`${ line.message }, Is it error: ${ line.isStdErr }`)
    //             if (line.isSystem === true || line.serviceId === service_id) {
    //                 console.log(`${(line.message).trim()} `)

    //             }
    //             // if ((await Cloud.sdk.models.device.getWithServiceDetails(dutUuid)).current_services.sut[0].status === "exited") {
    //             //     resolve(logCatcher)
    //             // }
    //         });

    //         deviceLogs.on('error', async function (line) {
    //             console.log(`THIS ERRROR: ${ line } `)
    //         })
    //     });
    // } else {
    //     throw new Error("Some tests still running")
    // }

// {
//     retries: 20,
//     maxTimeout: 2000
// }
// );

// }


module.exports = { waitSut }