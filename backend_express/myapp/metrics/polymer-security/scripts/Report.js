#! /usr/bin/env node
var WebDriver = require('./webdriver.js');
var DeployServer = require('./deployServer.js');
var fs = require('fs');
var program = require('commander');
var exec = require('child_process').exec;
var request = require('request');
var mixpanel = require('mixpanel');
var http = require('http');

// Avoid SSL errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// CONSTANTS
var CHORME_DEFAULT_CONF_FILE = __dirname + '/extension/scripts/config.json';
var EXPERIMENT_ID = new Date().getTime();
var EXPERIMENT_POST = "https://centauro.ls.etsiinf.upm.es:4444/security/experiment";
var CHORME_CONFIG_FILE = __dirname + '/../extension/scripts/config.json';

// READ DEFAULT_CONF FILE IF EXIST
var DEFAULT_CONF = {};
if (program.config) {
    DEFAULT_CONF = JSON.parse(fs.readFileSync(program.config, 'utf-8'));
}
// DEFAULT DEFAULT_CONFURATION
DEFAULT_CONF.timeout = DEFAULT_CONF.timeout || 5000;
DEFAULT_CONF.host = DEFAULT_CONF.host || '0.0.0.0';
DEFAULT_CONF.base = DEFAULT_CONF.base || __dirname;
module.exports = exports = function () {
    var Report = {};

    // PUBLISH EXPERIMENT ID IN THE SERVER. IT PERMIT IDENTIFY THE COMPONENT NAME
    Report.publishExperiment = function (component_name, experiment_id) {
        return new Promise(function (resolve, reject) {
            request.post(EXPERIMENT_POST, { form: { experiment_id: EXPERIMENT_ID, component: component_name } }, function (err, res, body) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
    }

    // OPEN A CHROME WINDOW WITH THE URL OF THE FILE. A EXTENSION WILL SEND RESULTS TO MIXPANEL 
    Report.runTest = function (file, server) {
        return new Promise(function (resolve, reject) {
            Report.publishExperiment(file, EXPERIMENT_ID).then(function () {
                var driver = new WebDriver();
                var url = 'http://' + DEFAULT_CONF.host + ':' + server.port + '/' + file;
                var opened = driver.open(url).then(function () {
                    setTimeout(function () {
                        driver.close().then(resolve);
                        // resolver la promesa con los datos enviados. Obtener de mixpanel.
                        var api_key = 'cbb3b275d6c69c69b7b8855427d6f62f',
                            api_secret = '1e465487d41098cb0e0ed0c5567666db';

                        today = new Date;
                        expireUTC = today.getTime() + 1E8;  // 1E8 is approximately a day in milliseconds
                        params = ["from_date=2018-01-01", "to_date=2018-25-10", "api_key=" + api_key, "api_secret=" + api_secret, "expire=" + expireUTC];
                        

                        var base_url =  "http://data.mixpanel.com/api/2.0/export/?";
                        var request = base_url + params.join("&");
                       var req = http.get(request, function(response){
                        body = '';
                        reponse.on("data", function(data){
                            body += data.toString();
                            console.log(body);
                        })
                       });
                    }, DEFAULT_CONF.timeout);
                });
            }, reject);
        });
    }

    Report.generateReport = function (test_file, conf) {

        return new Promise(function (resolve, reject) {
            Report.packingExtension().then(function () {
                CONF = Object.assign({}, DEFAULT_CONF, conf);
                var server = new DeployServer(conf);
                server.init().then(function () {
                    // Check if a simply file 
                    if (test_file || typeof conf.files == 'string') {
                        Report.runTest(test_file || conf.files, server).then(function () {
                            resolve();
                        }, reject);
                    } else { // Iterate over all files
                        var index = 0;
                        var max = conf.files.length;

                        var callback = function () {
                            return new Promise(function (resolve, reject) {
                                index++;
                                if (index < max) {
                                    Report.runTest(conf.files[index], server).then(callback, reject).then(resolve, reject);
                                } else {
                                    resolve();
                                }
                            });
                        };
                        Report.runTest(conf.files[index], server).then(callback).then(function () {
                            resolve();
                        }, function (err) {
                            console.error("Hubo algun problema en la recursividad", err);
                            reject();
                        });
                    }
                });
            }, reject)
        })
    }

    Report.packingExtension = function () {
        var pack_dir = __dirname + '/../crxmake.sh';
        var package_folder = __dirname + '/../extension';
        var output_pem = __dirname + '/../extension.pem';
        return new Promise(function (resolve, reject) {
            var chrome_config = JSON.parse(fs.readFileSync(CHORME_CONFIG_FILE, 'utf-8'));
            chrome_config.experiment_id = EXPERIMENT_ID;
            // SAVE EXPERIMENT_ID IN THE EXTENSION CONFIG 
            fs.writeFile(CHORME_CONFIG_FILE, JSON.stringify(chrome_config, null, '\t'), { flag: 'w' }, function (err) {
                if (err) {
                    reject(err);
                } else {

                    exec('bash ' + pack_dir + ' ' + package_folder + ' ' + output_pem, function (err, stdout, stderr) {
                        if (err) {
                            console.error(stderr);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        })
    }

    return Report;

}();