const { search } = require('./lib/search');
const { teardown } = require('./lib/teardown');
const { pinDut, getLatestRelease } = require('./lib/pin-to-release');
const { waitSut } = require('./lib/sut');
const yargs = require('yargs');

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
global.latestRelease = '';

async function main() {
  const options = yargs
    .option('fleet', {
      alias: 'f',
      describe: 'Balena cloud fleet name, to search ',
      demandOption: false, // Makes this option optional
      type: 'string',
    })
    .option('target', {
      alias: 't',
      describe: 'Target to deploy SUT to - could be SUT/DUT/Autokit',
      demandOption: true,
      type: 'string',
    })
    .option('release', {
      alias: 'r',
      describe: 'Release hash of balena fleet release to test. Defaults to latest',
      demandOption: false,
      type: 'string',
    }).help().argv

  const { fleet, target, release } = options;
  // console.log(`Options:`)
  // console.log(options)

  if (fleet !== undefined) {
    console.log(`Searching for device in fleet ${fleet}`);
    global.dutUuid = await search(fleet, release);
  } else if (target !== undefined) {
    console.log(`User provided device ${target}`)
    global.dutUuid = target
  } else {
    throw new Error(`No fleet or device provided!`)
  }

  if (release === undefined) {
    global.latestRelease = await getLatestRelease(target)
    console.log(`Fetching latest release, found: ${ global.latestRelease}`)
  } else {
    global.latestRelease = release
  }

  console.log(`Found device ${global.dutUuid}, pinning to release ${global.latestRelease}`);
  await pinDut(global.latestRelease, global.dutUuid);

  // DUT is now pinned to target release, wait for the test 
  // at this point, we can assume that the device is actually "running" the target release
  // let testId = `${Math.random().toString(36).substring(2, 10)}`
  let res = await waitSut( global.latestRelease, global.dutUuid);

  for (let log of res) {
    console.log(log)
  }

  // result = res.exitCode
  await teardown(global.dutUuid);
  process.exit(1)
}

main();