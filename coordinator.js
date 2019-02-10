/*Code from https://github.com/feross/md5-password-cracker.js*/
const numWorkers = 8; // NOTE: can't set this to be more than 8 without fixing the way numbers are carried
let workers = [];
let startTime;

function crack_hash(hash, log_container) {
    startTime = + new Date;
    function log(m) {
        log_container.value += m + '\n';
    }
    function status(m) {
        log_container.value = log_container.value.replace(/Status[^\n]*\n$/, '');
        log_container.value += "Status: " + m + '\n';
    }
    log("Starting workers (" + numWorkers + ")!");

    for (let i = 0; i < numWorkers; i++) {

        // Create worker
        const worker = new Worker('worker.js');
        workers.push(worker);

        // Message handler
        worker.addEventListener('message', function (e) {
            switch (e.data.cmd) {
                case "status":
                    status(e.data.data);
                    break;

                case "log":
                    log(e.data.data);
                    break;

                case "setRate":
                    status(addCommasToInteger(e.data.data) + " passwords/second", e.data.id)
                    break;

                case "foundPassword":
                    log("FOUND PASSWORD: " + e.data.data);

                    const totalTime = (+new Date - startTime) / 1000;
                    log("TOTAL TIME: " + totalTime + " seconds.");

                    workers.forEach(function (worker) {
                        worker.terminate()
                    });
                    log("Terminated all workers.");
                    break;

                default:
                    log("Main page doesn't understand command " + e.data.cmd);
                    break
            }
        });

        // Error handler
        worker.addEventListener('error', function (e) {
            log(['ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message].join(''))
        });

        // Set worker settings
        worker.postMessage({cmd: "setWorkerId", data: i});
        worker.postMessage({cmd: "setMaxPassLength", data: 6});
        worker.postMessage({cmd: "setPassToCrack", data: hash});

        // Start worker
        worker.postMessage({cmd: "performCrack", data: {start: i, hop: numWorkers}})
    }
}

function addCommasToInteger(x) {
    x = parseInt(x) + '';
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(x)) {
        x = x.replace(rgx, '$1' + ',' + '$2')
    }
    return x
}
