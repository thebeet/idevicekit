let EventEmitter = require('events');
let plist = require('plist');
let extend = require('extend');
let fs = require('fs');

let exec = require('./exec');

let _checkSerial = (serial) => {
    return /^[a-z0-9]{40,40}$/.test(serial);
};

class iDeviceClient extends EventEmitter {
    constructor() {
        super();
    }

    listDevices() {
        return exec('idevice_id -l').then((stdout) => {
            let devices = stdout.split('\n');
            let result = [];
            for (let device of devices) {
                device = device.trim();
                if (_checkSerial(device)) {
                    result.push(device);
                }
            }
            return result;
        });
    }

    // ## raw api ##

    getProperties(serial, option) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        let cmd = 'ideviceinfo -u ' + serial + ' -x';
        if (option) {
            if (('simple' in option) && (option['simple'])) {
                cmd += ' -s';
            }
            if (('domain' in option) && (option['domain'])) {
                cmd += ' -q ' + option['domain'];
            }
        }
        return exec(cmd).then((stdout) => {
            try {
                let result = plist.parse(stdout);
                return result;
            } catch (e) {
                throw e;
            }
        });
    }

    getPackages(serial, option) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        let defaultOption = {
            'list': 'user'
        };
        defaultOption = extend(true, defaultOption, option);
        let cmd = 'ideviceinstaller -u ' + serial + ' -l -o xml';
        if (defaultOption['list'] === 'system') {
            cmd = cmd + ' -o list_system';
        }
        if (defaultOption['list'] === 'all') {
            cmd = cmd + ' -o list_all';
        }
        return exec(cmd).then((stdout) => {
            try {
                let result = [];
                let packages = plist.parse(stdout);
                for (let packageObj of packages) {
                    result.push(packageObj['CFBundleIdentifier']);
                }
                return result;
            } catch (e) {
                throw e;
            }
        });
    }

    screencap(serial, option) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        let defaultOption = {
            format: 'png'
        }
        defaultOption = extend(true, defaultOption, option);
        let sharp = require('sharp');
        let tempfile = require('tempfile');
        let tempTiffFile = tempfile('.tiff');
        let cmd = 'idevicescreenshot -u ' + serial + ' ' + tempTiffFile;
        return exec(cmd).then((stdout) => {
            return sharp(tempTiffFile).toFormat(defaultOption.format);
        });
    }

    install(serial, ipa) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        if (!fs.existsSync(ipa)) return Promise.reject(`ipa file ${ipa} not exists`);
        let cmd = 'ideviceinstaller -u ' + serial + ' -i ' + ipa;
        return new Promise((resolve, reject) => {
            exec(cmd, {timeout: 300000}).then((output) => {
                if (/\s - Complete\s/.test(output)) {
                    resolve(output);
                } else {
                    reject(output);
                }
            }, (code, stdout, stderr) => {
                reject(code);
            });
        });
    }

    syslog(serial, ipa) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        let patternFile = require('path').join(__dirname, 'patterns.yml');
        let spawn = require('child_process').spawn;
        let emitter = new EventEmitter();
        let process = spawn('idevicesyslog', ['-u', serial]);
        let Logparser = require('logagent-js');
        let lp = new Logparser(patternFile);
        process.stdout.setEncoding('utf8');
        process.stdout.on('data', (data) => {
            let str = data.toString(),
                lines = str.split(/(\r?\n)/g);
            for (let line of lines) {
                lp.parseLine(line, 'log', (err, data) => {
                    if (err) {
                    } else {
                        emitter.emit('log', data);
                    }
                });
            }
        });
        process.stdout.on('end', () => {
            emitter.emit('close');
        });
        emitter.on('close', () => {
            process.kill();
        });
        return Promise.resolve(emitter);
    }

    reboot(serial) {
        if (!_checkSerial(serial)) return Promise.reject('invalid serial number');
        let cmd = 'idevicediagnostics restart -u ' + serial;
        return exec(cmd).then(() => {
            return true;
        });
    }

    // ## shortcut method ##

    getResolution(serial) {
        return this.getProperties(serial, {domain: 'com.apple.mobile.iTunes'})
            .then((result) => {
                return {
                    width: result['ScreenWidth'],
                    height: result['ScreenHeight'],
                    scale: result['ScreenScaleFactor']
                };
            });
    }

    getStorage(serial) {
        return this.getProperties(serial, {domain: 'com.apple.disk_usage'})
            .then((result) => {
                let size = result['TotalDataCapacity'];
                let free = result['TotalDataAvailable'];
                let used = size - free;
                return {
                    size: size,
                    used: used,
                    free: free,
                    free_percent: parseInt(free * 100 / (size + 2), 10) + '%'
                }
            });
    }

    getBattery(serial) {
        return this.getProperties(serial, {domain: 'com.apple.mobile.battery'})
            .then((result) => {
                result['level'] = result['BatteryCurrentCapacity'];
                return result;
            });
    }

    getDeveloperStatus(serial) {
        return this.getProperties(serial, {domain: 'com.apple.xcode.developerdomain'})
            .then((result) => {
                return result['DeveloperStatus'];
            });
    }

}

module.exports = new iDeviceClient();
