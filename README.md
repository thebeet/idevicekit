NodeJs wrapper for libimobiledevice

## Requirements
* [Node.js][nodejs] >= 6.0
* libimobiledevice & ideviceinstaller

```bash
brew install libimobiledevice
brew install ideviceinstaller
```
## Getting started

Install via NPM:

```bash
npm install --save idevicekit
```

## API

### idevicekit.listDevices()

Gets the list of currently connected devices.

* Returns: `Promise`
* Resolves with: `devices` An array of device's serial

### idevicekit.getProperties(serial, [option])

Retrieves the properties of the device identified by the given serial number. This is analogous to `ideviceinfo`.

* **serial** The serial number of the device. Corresponds to the device ID in `idevicekit.listDevices()`.
* **option** Optional. The following options are supported, use `ideviceinfo --help` to learn more
    - **simple** When `true`, use a simple connection to avoid auto-pairing with the device, Default: false
    - **domain** set domain of query to NAME. Default: None 
* Returns: `Promise`
* Resolves with: `properties` An JSON Object of device's properties.  

### idevicekit.getPackages(serial, [option])

Retrieves the list of packages present on the device. This is analogous to `ideviceinstaller`.

* **serial** The serial number of the device. Corresponds to the device ID in `idevicekit.listDevices()`.
* **option** Optional. The following options are supported, use `ideviceinstaller --help` to learn more
    - **list** List apps, possible options:
       - **user**: list user apps only (this is the default)
       - **system**: list system apps only
       - **all**: list all types of apps
    
* Returns: `Promise`
* Resolves with: `packages` An array of app package

### idevicekit.screencap(serial)

Takes a screenshot in PNG format using `idevicescreenshot`. 

* Returns: `Promise`
* Resolves with: `screencap` An PNG stream.

### idevicekit.install(serial, ipa)

Installs the IPA on the device, This is analogous to `ideviceinstaller -i <ipa>`

* Returns: `Promise`
* Resolves with: `output` output of install command

### idevicekit.syslog(serial)

Retrieves syslog on the device, This is analogous to `idevicesyslog`

* **serial** The serial number of the device. Corresponds to the device ID in `idevicekit.listDevices()`.
* Returns: `Promise`
* Resolves with: `emitter` emit "log" event when log come

idevicesyslog will continue running until a 'close' event emit to emitter

### idevicekit.reboot(serial)

reboot using `idevicediagnostics restart`. 

* Returns: `Promise`
* Resolves with: `success` True if success

## shortcut API

### getResolution(serial)
### getStorage(serial)
### getBattery(serial)

## Example

```js
let co = require('co');
let idevicekit = require('./index');
let fs = require('fs');

co(function* () {
    let devices = yield idevicekit.listDevices();
    for (let device of devices) {
        let properties = yield idevicekit.getProperties(device);
        let battery = (yield idevicekit.getBattery(device)).level;
        let resolution = yield idevicekit.getResolution(device);
        let status = yield idevicekit.getDeveloperStatus(device);
        console.log(`${device}: ${properties['DeviceName']}`);
        console.log(`    model: ${properties['ProductType']}`);
        console.log(`    battery: ${battery}`);
        console.log(`    resolution: ${resolution['width']}x${resolution['height']}`);
        console.log(`    status: ${status}`);
        let screenshotStream = yield idevicekit.screencap(device);
        screenshotStream.pipe(fs.createWriteStream(device + '.png'));
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

```
