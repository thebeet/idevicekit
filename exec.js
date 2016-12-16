let child_process = require('child_process');

let exec = (cmd, option) => {
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
        child_process.exec(cmd, defaultOption, (err, stdout, stderr) => {
            if (err) {
                reject(err, stdout, stderr);
            } else {
                resolve(stdout, stderr);
            }
        });
    });
};

module.exports = exec;
