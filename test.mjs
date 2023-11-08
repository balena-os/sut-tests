#!/usr/bin/env zx

$.shell = await which("bash")
$.prefix = ''
$.verbose = true

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('u', {
        alias: 'dut_uuid',
        type: 'string',
        demandOption: true,
        describe: 'The DUT UUID'
    })
    .option('s', {
        alias: 'sut_ref',
        type: 'string',
        demandOption: true,
        describe: 'The SUT reference'
    })
    .option('c', {
        alias: 'docker_arg',
        type: 'string',
        demandOption: true,
        describe: 'Docker argument'
    })
    .version()
	.help('help')
	.showHelpOnFail(false, 'Something went wrong! run with --help')
    .argv;

console.log(argv)
// SSH into DUT and pull image
await $`echo "balena pull ${argv.sut_ref}; exit;" | balena ssh ${argv.dut_uuid}`
// await $`echo "balena pull ${argv.sut_ref}; exit;" | balena ssh ${argv.dut_uuid}

const current_time = Date.now()
let d = argv.docker_arg.replace(/['"]/g, '')
let cmd = `echo "balena run --name SUT-${current_time} ${d} ${argv.sut_ref}; exit;" | balena ssh ${argv.dut_uuid} | tail -n +4`
console.log(cmd)
// ssh into DUT and run image
await $`${cmd}`

exit_code= await $`echo "balena inspect --format={{.State.ExitCode}} SUT-${current_time}; exit;" | balena ssh ${argv.dut_uuid} | tail -n +4`

if (exit_code) {
  exit_code=1337
}

console.log(`Exit code was ${exit_code}`)

process.kill(exit_code) 

// npx zx test.mjs -u 2a42142356d684662e4b2624745d1ec0 -s bh.cr/gh_rcooke_warwick/sut-pass -c "--privileged --network host"