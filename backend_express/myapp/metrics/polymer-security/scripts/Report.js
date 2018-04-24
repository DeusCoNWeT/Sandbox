#! /usr/bin/env node
var WebDriver = require('./webdriver.js');
var DeployServer = require('./deployServer.js');
var fs = require('fs');
var program = require('commander');
var exec = require('child_process').exec;
var request = require('request');
var mixpanel = require('mixpanel');
var request = require("request");
var sleep = require("sleep");

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
                        driver.close();
                        // sleep.sleep(10);
                        // resolver la promesa con los datos enviados. Obtener de mixpanel.
                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth() + 1;
                        var yyyy = today.getFullYear();
                        if (dd < 10) {
                            dd = '0' + dd
                        }
                        if (mm < 10) {
                            mm = '0' + mm
                        }
                        today = yyyy + '-' + mm + '-' + dd;
                        var options = {
                            method: 'GET',
                            url: 'https://data.mixpanel.com/api/2.0/export/',
                            qs: { from_date: today, to_date: today },
                            headers:
                                {
                                    'cache-control': 'no-cache',
                                    authorization: 'Basic MWU0NjU0ODdkNDEwOThjYjBlMGVkMGM1NTY3NjY2ZGI6'
                                }
                        };

                        request(options, function (error, response, body) {
                            if (error) throw new Error(error);

                            // console.log(body);
                            var data_split = body.split('\n');
                            // console.log(data_split);
                            var last_position_array = data_split.length;
                            var data_json = JSON.parse(data_split[last_position_array-1]);
                             console.log(data_json);
                            // if(data_json.properties.experiment_id === EXPERIMENT_ID){
                                var value_sec = data_json.properties.value;
                                console.log(value_sec);
                                resolve(value_sec);
                            // }
                            // reject();
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