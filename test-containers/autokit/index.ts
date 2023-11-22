import { Autokit } from '@balena/autokit';
import { OsDownloadOptions, getSdk } from 'balena-sdk';
import { readFile, createReadStream, createWriteStream, unlink, writeFile } from 'fs';
import { exec } from 'child_process';
import { promisify} from 'util';
import * as retry from 'async-retry';

const execAsync = promisify(exec);
const writeFileAsync = promisify(writeFile);

// Todo - make this configurable via device env vars
const autokitConfig = {
    power: 'autokitRelay',
    sdMux: 'linuxAut',
    network: 'linuxNetwork',
    video: 'linuxVideo',
    serial: 'dummySerial',
    usbBootPort: '4',
    digitalRelay: 'dummyPower'
}

async function main(){
    const autoKit = new Autokit(autokitConfig);
    await autoKit.setup();

    const balena = getSdk({ 
        apiUrl: process.env.BALENA_API_URL || 'https://api.balena-cloud.com/',
    });
    if(process.env.BALENA_API_KEY !== undefined){
        await balena.auth.loginWithToken(process.env.BALENA_API_KEY);
    } else {
        throw new Error (`No API key provided`)
    }    

    const PATH = '/tmp/os.img'

    console.log(`Trying to download OS image for ${process.env.DEVICE_TYPE}`)
    console.log(`For app: ${process.env.APP}`)
    // download target os version
    await new Promise<void>(async (resolve, reject) => {
        if(process.env.DEVICE_TYPE !== undefined){
            let download = await balena.models.os.download({
                deviceType: process.env.DEVICE_TYPE,
                version: process.env.VERSION,
                appId: Number(process.env.APP),
                developmentMode: true
            });
            
            download.on('error', (error: Error)=> {
                console.log(error);
                reject()
            })

            download.pipe(createWriteStream(PATH));
            download.on('finish', () => {
                console.log(`Download Successful: ${PATH}`);
                resolve();
            });
        }
    }).catch((reason:any) => {
        console.log(`Rejected!`)
        console.log(reason)
        throw new Error(`Download failed`)
    })


    console.log(`Downloaded image!`)

    await autoKit.power.off();
    await autoKit.network.createWiredNetwork();
    
    console.log(`Starting flash!`)
    await autoKit.flash(PATH, process.env.FLASH_TYPE || 'raspberrypi3');

    // Power on DUT
    await autoKit.power.on();

    // Find the DUT UUID and IP address
    // Easier to find IP address first
    await retry(
        async () => {
            let res = await execAsync(`arp -a | grep ${process.env.WIRED_IF} | awk -F " " '{print $2}'`)
            let ip = res.stdout.replace('(', '').replace(')','');
        
            // Using IP, find the UUID of the device
            res = await execAsync(`ssh root@${ip.trim()} -p 22222  -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "cat /mnt/boot/config.json" 2>/dev/null`);
            
            let configJson = JSON.parse(res.stdout);
            let uuid = configJson.uuid;
        
            // write this to a file so it can be used by ay subsequent tests
            await writeFileAsync(`/tmp/uuid`, uuid);
            console.log(`UUID of resulting device is: ${uuid}`)
        },
        {
          retries: 20,
          minTimeout: 10 * 1000
        }
    );
    
    process.exit()
}

main();