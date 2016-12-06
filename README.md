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

* Returns: `Promise`
* Resolves with: `packages` An array of app package

### idevicekit.screencap(serial)

Takes a screenshot in PNG format using `idevicescreenshot`. 

* Returns: `Promise`
* Resolves with: `screencap` An PNG stream.

### idevicekit.reboot(serial)

reboot using `idevicediagnostics restart`. 

* Returns: `Promise`
* Resolves with: `success` True if success

## Example

```js
let co = require('co');
let idevicekit = require('idevicekit');
let fs = require('fs');

co(function* () {
    let devices = yield idevicekit.listDevices();
    for (let device of devices) {
        let properties = yield idevicekit.getProperties(device);
        let battery = yield idevicekit.getProperties(device, {domain: 'com.apple.mobile.battery'});
        battery = battery['BatteryCurrentCapacity'];
        let resolution = yield idevicekit.getProperties(device, {domain: 'com.apple.mobile.iTunes'});
        resolution = {
            width: resolution['ScreenWidth'],
            height: resolution['ScreenHeight']
        };
        console.log(`${device}: ${properties['DeviceName']}`);
        console.log(`    model: ${properties['ProductType']}`);
        console.log(`    battery: ${battery}`);
        console.log(`    resolution: ${resolution['width']}x${resolution['height']}`);
        let screenshotStream = yield idevicekit.screencap(device);
        screenshotStream.pipe(fs.createWriteStream(device + '.png'));
    }
});

```
