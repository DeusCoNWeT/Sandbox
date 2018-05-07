var wcc_report = require('../metrics/polymer-complexity/src/Report');
var acc_report = require('../metrics/polymer-accessibility/src/Report');
var sec_report = require('../metrics/polymer-security/scripts/Report');
// var acc_report = require('../metrics/polymer-accesibility/src/Report')
// USING CHILD_PROCESS (for execute bash)
var https = require("https");
var child_process = require('child_process');
var path = require('path');
var getPort = require('get-port');
var db = require('./mydb').getInstance();
var mongoose = require('mongoose');
var LATENCY = 0, STRUCTURAL = 1, COMPLEXITY = 2, MAINTENACE = 3, ACCURACY = 4, USABILITY = 5, SECURITY = 6, REFRESH = 7;
var SPOTIFY = 0, TWITTER = 1, TRAFFIC = 2, PINTEREST = 3, WEATHER = 4, GOOGLE_PLUS = 5, FINANCE_SEARCH = 6, FACEBOOK = 7, REDDIT = 8;
var MAX_CONT = 3;

module.exports = {
    get_component: function (id) {
        return new Promise(function (resolve, reject) {
            mongoose.connect(db, function (err, db) {
                if (err) {
                    reject(err);
                    return;
                }
                var name_component = db.collection('component').find({ component_id: id }, { "attributes": 1, "_id": 0 });
                // Should be better have an object not an array
                name_component.toArray(function (err, docs) {
                    if (err) {
                        reject(err);
                        db.close();
                    } else {
                        resolve(docs.map(function (doc) {
                            // Deberia comprobar que si el objeto doc que me devuelve (ya he visto que es un objeto)
                            // es igual a [] y de esa manera mandar un reject(err); ya que no coincide con nada
                            return {
                                attributes: JSON.parse(doc.attributes),
                            }
                        }));
                        db.close();
                    }
                });

            });

        })
    },
    analize_metric: function (object_tokens) {
        var value_met = {
            component: [
                {
                    name: "latency",
                    value: 45.2
                },
                {
                    name: "structural",
                    value: ""
                },
                {
                    name: "complexity",
                    value: ""
                },
                {
                    name: "maintencance",
                    value: ""
                },
                {
                    name: "accuracy",
                    value: ""
                },
                {
                    name: "usability",
                    value: ""
                },
                {
                    name: "security",
                    value: ""
                },
                {
                    name: "refresh",
                    value: 45.2
                }

            ],
            name_component: ""
        }
        // ROL SELECTED
        var object_rol = object_tokens.attr;
        var rol_selected = object_rol.rol;
        //ESTRUCTURAL 
        var calidad_estructural;

        //Llamar al script de las metricas
        var base_folder = path.join(__dirname, '../components/');
        var base_folder_usability = path.join(__dirname, '../metrics/polymer-accessibility/');
        var list_folder = ['bower_components/spotify-component-stable/spotify-component.html', 'bower_components/twitter-timeline-stable/static/twitter-timeline.html', 'bower_components/traffic-incidents-stable/traffic-incidents.html',
            'bower_components/pinterest-timeline-stable/pinterest-timeline.html', 'bower_components/open-weather-stable/open-weather.html', 'bower_components/googleplus-timeline-stable/googleplus-timeline.html', 'bower_components/finance-search-stable/finance-search.html',
            'bower_components/facebook-wall-stable/facebook-wall.html', 'bower_components/reddit-timeline-stable/reddit-timeline.html'];
        var list_folder_demo = ['bower_components/spotify-component-stable/', 'bower_components/twitter-timeline-stable/static/', 'bower_components/traffic-incidents-stable/',
            'bower_components/pinterest-timeline-stable/', 'bower_components/open-weather-stable/', 'bower_components/googleplus-timeline-stable/', 'bower_components/finance-search-stable/',
            'bower_components/facebook-wall-stable/', 'bower_components/reddit-timeline-stable/'];
        // FALTA REDDIT
        // Hay que hacer que el objeto que traemos tenga el nombre del componente, y aqui lo comprobamos si ese nombre contiene una lapabra de spoty, twitter etc..

        // var component = list_folder[3];
        var new_index = 'demo/index.html';
        var component, component_demo, name_cmp;

        ////////////////////////////// FOLDER OF COMPONENTS////////////////////////////////////////
        var name_comp = object_tokens.nameComp;
        if (name_comp.includes('spotify')) {
            component = list_folder[SPOTIFY];
            component_demo = list_folder_demo[SPOTIFY];
            new_index = 'index.html';
            name_cmp = 'Spotify';
        } else if (name_comp.includes('twitter')) {
            component = list_folder[TWITTER];
            component_demo = list_folder_demo[TWITTER];
            name_cmp = 'Twitter';
        } else if (name_comp.includes('facebook')) {
            component = list_folder[FACEBOOK];
            component_demo = list_folder_demo[FACEBOOK];
            new_index = 'demo.html';
            name_cmp = 'Facebook';
        } else if (name_comp.includes('google')) {
            component = list_folder[GOOGLE_PLUS];
            component_demo = list_folder_demo[GOOGLE_PLUS];
            name_cmp = 'Google +';
        } else if (name_comp.includes('finance')) {
            component = list_folder[FINANCE];
            component_demo = list_folder_demo[FINANCE];
            name_cmp = 'Finance Search';
        } else if (name_comp.includes('weather')) {
            component = list_folder[WEATHER];
            component_demo = list_folder_demo[WEATHER];
            name_cmp = 'Open Weather';
        } else if (name_comp.includes('pinterest')) {
            component = list_folder[PINTEREST];
            component_demo = list_folder_demo[PINTEREST];
            name_cmp = 'Pinterest';
        } else if (name_comp.includes('reddit')) {
            component = list_folder[REDDIT];
            component_demo = list_folder_demo[REDDIT];
            name_cmp = 'Reddit';
        } else {
            component = list_folder[TRAFFIC];
            component_demo = list_folder_demo[TRAFFIC];
            name_cmp = 'Traffic incidents';
        }

        var folder = base_folder + component;
        var index_component = base_folder + component_demo + new_index;
        var folder_usability = component_demo + new_index;

        return new Promise(function (resolve, reject) {
            function contador(max) {
                var cont = 0;
                return function () {
                    cont++;
                    if (cont === max) {
                        value_met.name_component = name_cmp;
                        resolve(value_met);
                    }
                }
            }
            var cb = contador(MAX_CONT);

            // METRIC 1: COMPLEXITY & MANTENIBILIDAD
            wcc_report.analyze(folder).then(function (result) {
                var val_complexity = result.js[0].complexity.methodAverage.cyclomatic;
                var val_maintenance = result.js[0].complexity.maintainability;
                value_met.component[COMPLEXITY].value = val_complexity;
                value_met.component[MAINTENACE].value = val_maintenance;
                cb();

            }, reject);
            // METRIC 2: STRUCTURAL
            child_process.execFile('../metrics/imports-analyzer/countImports.py', ['-u', folder], function (error, stdout, stderr) {
                var expression = /\d* imports \(totales \d*\)/;
                var number_imports = stdout.match(expression);
                if(number_imports > 0 && number_imports <= 25){
                    calidad_estructural = 5;
                }else if(number_imports <= 40){
                    calidad_estructural = 4.5;
                }else if(number_imports <= 55){
                    calidad_estructural = 4;
                }else if(number_imports <= 60){
                    calidad_estructural = 3;
                }else if(number_imports <= 70){
                    calidad_estructural = 2;
                }else{
                    calidad_estructural = 1;
                }
                value_met.component[STRUCTURAL].value = number_imports;
                cb();
            });
            // Metric 3: USABILITY  
            var config = {
                root: '/home/miguel/proyecto/sandbox/backend_express/myapp/metrics/polymer-accessibility',
                port: '8100',
                timeout: '5000',
                wcag: true,
                a11y: true,
                wcag2_level: 'AAA',
                log_level: 'OFF',
                brief: true,
                skip: true
            }
            getPort().then(port_us => {
                // Get port random available
                var path = 'http://localhost:' + port_us + '/' + folder_usability;
                config.port = port_us;
                // var pinterest = 'http://localhost:8100/bower_components/pinterest-timeline-stable/demo/index.html'
                acc_report._setProgram(config);
                acc_report.analyze_file(path).then(function (result) {
                    value_met.component[USABILITY].value = result.value.value;
                    cb();
                }, reject);
            });
            // Metric 4: SECURITY

            // getPort().then(port_us => {
            //     var config_sec = {
            //         host: '0.0.0.0',
            //         port: port_us   
            //     }
            //     sec_report.generateReport('bower_components/spotify-login-security/demo.html',config_sec).then(function(result){
            //         value_met.component[SECURITY].value = result;
            //         console.log(result);
            //         console.log(error);
            //         // cb();
            //         // console.log(result);
            //     });
            // });
            var calidad_total;
            switch(rol_selected){
                case "proveedor":
                    calidad_total = 2;
                    break;
                case "notecnico":
                    calidad_total = 1;
                    break;
                case "integrador":
                    calidad_total = 3;
                    break;
                default:
                    calidad_total = 4;
           }
            console.log(calidad_total);
        });
    }
};


