const { search } = require('./lib/search');
const { teardown } = require('./lib/teardown');
const { pinDut } = require('./lib/pin-to-release');
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
    // const args = process.argv.slice(2);

    // let app = args[0];
    // let release = args[1];
    // let sut = args[2];

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
      })
      .option('sut', {
        alias: 's',
        describe: 'Test container reference',
        demandOption: true,
        type: 'string',
      })
      .option('dut', {
        alias: 'd',
        describe: 'Flag to indicate whether its autokit or DUT',
        default: true,
        type: 'boolean',
      }).argv;
    
    // laptop -> run this script -> pushes autokit sut to autokit -> autokit sut flashes dut -> autokit runs this script -> pushes the actual sut tests to DUT -> 

    const { fleet, target, release, sut, dut } = options;
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

    // If its a non-autokit, pin device to release
    if (dut){
        console.log(`Found device ${global.dutUuid}, pinning to release ${release}`);
        await pinDut(release, dutUuid)
    }

    console.log(`### Beginning test ###`)
    // DUT is now pinned to target release, run the test 
    let result = await new Promise(async (resolve, reject) => {
        let test = spawn('./test.sh', [
            '-u',
            `${global.dutUuid}`,
            '-s',
            `${sut}`, 
            '-c',
            `--privileged --network host --env BALENA_API_KEY=${process.env.BALENA_API_KEY} --env WIRED_IF=enp1s0u1u3u4 --env DEVICE_TYPE=latest --env APP=gh_rcooke_warwick/leviathan-migrator --env UDEV=1 -v /lib/modules:/lib/modules -v /run/dbus:/host/run/dbus`
        ], { stdio: 'inherit', timeout: 1000 * 60 * 10 });

        // test.stdout.on('data', (data) => {
        //     console.log(`[Test stdout]: ${data.toString()}`)
        // })

        // test.stderr.on('data', (data) => {
        //     console.log(`[Test stderr]: ${data.toString()}`)
        // })
        
        // test.stdout.pipe(p)
        // p.on('line', function (line) {
        //     const tapLineRegex = /^\s*(ok|not ok)\s+\d+\s*-\s+.+/;
        //     if(!tapLineRegex.test(line)){
        //         console.log(line)
        //     }
        // })
        test.on('exit', (code) => {
            resolve(code)
        });
        test.on('error', (err) => {
            process.off('SIGINT', handleSignal);
            process.off('SIGTERM', handleSignal);
            reject(err);
        });
    });

    await teardown(global.dutUuid);
    process.exit(result)
}

main();