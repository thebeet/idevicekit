let EventEmitter = require('events');

let shell = require('shelljs');
shell.config.silent = true;
let plist = require('plist');

class iDeviceClient extends EventEmitter {
    constructor() {
        super();
    }

    listDevices() {
        return new Promise((resolve, reject) => {
            shell.exec('idevice_id -l', (code, stdout, stderr) => {
                if (code === 0) {
                    let devices = stdout.split('\n');
                    let result = [];
                    for (let device of devices) {
                        device = device.trim();
                        if (device.length === 40) {
                            result.push(device);
                        }
                    }
                    resolve(result);
                } else {
                    reject(stdout, stderr);
                }
            });
        });
    }

    getProperties(serial, option) {
        return new Promise((resolve, reject) => {
            let cmd = 'ideviceinfo -u ' + serial + ' -x';
            if (('simple' in option) && (option['simple'])) {
                cmd += ' -s';
            }
            if (('domain' in option) && (option['domain'])) {
                cmd += ' -q ' + option['domain'];
            }
            shell.exec(cmd, (code, stdout, stderr) => {
                if (code === 0) {
                    try {
                        let result = plist.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(stdout, stderr);
                }
            });
        });
    }

    getPackages(serial) {
        return new Promise((resolve, reject) => {
            let cmd = 'ideviceinstaller -u ' + serial + ' -l -o xml';
            shell.exec(cmd, (code, stdout, stderr) => {
                if (code === 0) {
                    try {
                        let result = plist.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(stdout, stderr);
                }
            });
        });
    }

    screencap(serial, option) {
        let defaultOption = {
            format: 'png'
        }
        let extend = require('extend');
        defaultOption = extend(true, defaultOption, option);
        return new Promise((resolve, reject) => {
            let sharp = require('sharp');
            let tempfile = require('tempfile');
            let tempTiffFile = tempfile('.tiff');
            let cmd = 'idevicescreenshot -u ' + serial + ' ' + tempTiffFile;
            shell.exec(cmd, (code, stdout, stderr) => {
                if (code === 0) {
                    resolve(sharp(tempTiffFile).toFormat(defaultOption.format));
                } else {
                    reject(stdout, stderr);
                }
            });
        });
    }
}


module.exports = new iDeviceClient();
