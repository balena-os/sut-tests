#!/bin/bash
while getopts u:s:c: flag
do
    case "${flag}" in
        u) dut_uuid=${OPTARG};;
        s) sut_ref=${OPTARG};;
        c) docker_arg=${OPTARG};;
    esac
done


# ssh into DUT and pull image
echo "balena pull $sut_ref; exit;" | balena ssh $dut_uuid > /dev/null

current_time=$(date +"%Y%m%d%H%M%S")
# ssh into DUT and run image 
echo "balena run --name $current_time-sut $docker_arg $sut_ref; exit;" | balena ssh $dut_uuid | tail -n +4

exit_code=$(echo "balena inspect --format={{.State.ExitCode}} $current_time-sut; exit;" | balena ssh $dut_uuid | tail -n +4)

if [ -z "$exit_code" ]; then
    exit_code=1337
fi

echo "Exit code was $exit_code"

exit $exit_code 