const { search } = require('./lib/search');
const { teardown } = require('./lib/teardown');
const { pinDut } = require('./lib/pin-to-release');
const { waitSut } = require('./lib/sut');
const { spawn } = require('child_process');
require('dotenv').config();
const { Parser } = require('tap-parser');
const yargs = require('yargs');


// const p = new Parser(results => console.dir(results))
// p.on('line', (line)=> {
//     console.log(`line: ${line.toString()}`)
// })

// p.on('complete', function (results) {
//     console.log(results)
// })


process.on('exit', async (code) => {
    console.log(`Exiting with code: ${code}`);
    await teardown(global.dutUuid);
  });
  
// Handle Ctrl+C (SIGINT) event
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    await teardown(global.dutUuid);
    process.exit(2);
  });
  
// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await teardown(global.dutUuid);
    process.exit(1);
  });

global.dutUuid = '';

async function main(){
    const options = yargs
      .option('fleet', {
        alias: 'f',
        describe: 'Balena cloud fleet name, to search ',
        demandOption: false, // Makes this option optional
        type: 'string',
      })
      .option('target', {
        alias: 't',
        describe: 'Target to deploy SUT to - could be autokit, could be DUT itself',
        demandOption: false,
        type: 'string',
      })
      .option('release', {
        alias: 'r',
        describe: 'Release hash of balena fleet release to test',
        demandOption: true,
        type: 'string',
      }).argv

    const { fleet, target, release } = options;
    console.log(`Options:`)
    console.log(options)

    if(fleet !== undefined){
        console.log(`Searching for device in fleet ${fleet}`);
        global.dutUuid = await search(fleet, release);
    } else if(target !== undefined){
        console.log(`User provided device ${target}`)
        global.dutUuid = target
    } else {
        throw new Error(`No fleet or device provided!`)
    }

  
    console.log(`Found device ${global.dutUuid}, pinning to release ${release}`);
    await pinDut(release, global.dutUuid);
    
    console.log(`### Beginning test ###`)
    // DUT is now pinned to target release, wait for the test 
    // at this point, we can assume that the device is actually "running" the target release
    let testId = `${Math.random().toString(36).substring(2, 10)}`
    let res = await waitSut(release, global.dutUuid, testId);

    for(let log of res.testlogs){
      console.log(log)
    }

    result = res.exitCode
    await teardown(global.dutUuid);
    process.exit(result)
}

main();