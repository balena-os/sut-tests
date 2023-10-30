while getopts u:s: flag
do
    case "${flag}" in
        u) dut_uuid=${OPTARG};;
        s) sut_ref=${OPTARG};;
    esac
done


# ssh into DUT and pull image
echo "balena pull $sut_ref; exit;" | balena ssh $dut_uuid 

current_time=$(date +"%Y%m%d%H%M%S")
# ssh into DUT and run image 
echo "balena run --name $current_time-sut $sut_ref; exit;" | balena ssh $dut_uuid | tail -n +4

exit_code=$(echo "balena inspect --format={{.State.ExitCode}} $current_time-sut; exit;" | balena ssh $dut_uuid | tail -n +4)

echo "Exit code was $exit_code"
