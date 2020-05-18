let child_process = require('child_process');

let exec = (cmd, args, option) => {
    let defaultOption = {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 256*1024*1024,
        killSignal: 'SIGTERM',
        cwd: null,
        env: null
    };
    if (option) {
        let extend = require('extend');
        defaultOption = extend(true, defaultOption, option);
    }
    return new Promise((resolve, reject) => {
        child_process.execFile(cmd, args, defaultOption, (err, stdout, stderr) => {
            if (err) {
                reject(err, stdout, stderr);
            } else {
                resolve(stdout, stderr);
            }
        });
    });
};

module.exports = exec;
