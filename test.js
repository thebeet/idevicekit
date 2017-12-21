let co = require('co');
let idevicekit = require('./index');
let fs = require('fs');

co(function* () {
    let devices = yield idevicekit.listDevices();
    for (let device of devices) {
        let properties = yield idevicekit.getProperties(device);
        let name = yield idevicekit.name(device);
        let basicInformation = yield idevicekit.getBasicInformation(device);
        let battery = (yield idevicekit.getBattery(device)).level;
        let resolution = yield idevicekit.getResolution(device);
        let status = yield idevicekit.getDeveloperStatus(device);
        console.log(`${device}: ${name}`);
        console.log(`    model: ${properties['ProductType']}`);
        console.log(`    basic: ${JSON.stringify(basicInformation)}`);
        console.log(`    battery: ${battery}`);
        console.log(`    resolution: ${resolution['width']}x${resolution['height']}`);
        console.log(`    status: ${status}`);
        let screenshotStream = yield idevicekit.screencap(device);
        screenshotStream.pipe(fs.createWriteStream(device + '.png'));
        yield idevicekit.crashreport(device, 'CrashDemo').then((crashLogs) => {
            console.log(JSON.stringify(crashLogs));
        });
        idevicekit.syslog(device).then((emitter) => {
            emitter.on('log', (data) => {
                console.log(JSON.stringify(data));
            });
            setTimeout(() => {
                emitter.emit('close');
            }, 10000);
        });
    }
}).catch((err) => {
    console.log(err);
});
