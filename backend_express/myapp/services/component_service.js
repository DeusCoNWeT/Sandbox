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
        //Variables Globales 
        var calidad_estructural;
        var component, component_demo, name_cmp;
        var cal_complexity, cal_maintenance, cal_structural, cal_accuracy, cal_usability;
        // JSON con valores de Calidad
        var value_met = {
            component: [
                {
                    name: "latency",
                    value: 4558.8
                },
                {
                    name: "structural",
                    value: 0
                },
                {
                    name: "complexity",
                    value: 0
                },
                {
                    name: "maintenance",
                    value: 0
                },
                {
                    name: "accuracy",
                    value: 0
                },
                {
                    name: "usability",
                    value: 0
                },
                {
                    name: "security",
                    value: 5
                },
                {
                    name: "refresh",
                    value: 57.888
                }

            ],
            name_component: ""
        }
        /************************************************************** COMPONENTS LOCATION************************************************************/
        var object_rol = object_tokens.attr;
        var rol_selected = object_rol.rol;
        var base_folder = path.join(__dirname, '../components/');
        var base_folder_usability = path.join(__dirname, '../metrics/polymer-accessibility/');
        var list_folder = ['bower_components/spotify-component-stable/spotify-component.html', 'bower_components/twitter-timeline-stable/static/twitter-timeline.html', 'bower_components/traffic-incidents-stable/traffic-incidents.html',
            'bower_components/pinterest-timeline-stable/pinterest-timeline.html', 'bower_components/open-weather-stable/open-weather.html', 'bower_components/googleplus-timeline-stable/googleplus-timeline.html', 'bower_components/finance-search-stable/finance-search.html',
            'bower_components/facebook-wall-stable/facebook-wall.html', 'bower_components/reddit-timeline-stable/reddit-timeline.html'];
        var list_folder_demo = ['bower_components/spotify-component-stable/', 'bower_components/twitter-timeline-stable/static/', 'bower_components/traffic-incidents-stable/',
            'bower_components/pinterest-timeline-stable/', 'bower_components/open-weather-stable/', 'bower_components/googleplus-timeline-stable/', 'bower_components/finance-search-stable/',
            'bower_components/facebook-wall-stable/', 'bower_components/reddit-timeline-stable/'];
        var new_index = 'demo/index.html';
        /***********************************************************************************************************************************************/

        /***************************************************************** FOLDERS *********************************************************************/
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
        /***********************************************************************************************************************************************/

        /****************************************************** CALLBACK - PROMISE *********************************************************************/
        var that = this;
        return new Promise(function (resolve, reject) {
            function contador(max) {
                var cont = 0;
                return function () {
                    cont++;
                    if (cont === max) {
                        value_met.name_component = name_cmp;
                        var calidad = that.quality(value_met);
                        // resolve(value_met union calidad);
                        resolve(value_met);
                    }
                }
            }
            var cb = contador(MAX_CONT);
            /***********************************************************************************************************************************************/

            /****************************************************** METRIC 1: COMPLEXITY & MANTENIBILIDAD *************************************************/
            wcc_report.analyze(folder).then(function (result) {
                var val_complexity = result.js[0].complexity.methodAverage.cyclomatic;
                var val_maintenance = result.js[0].complexity.maintainability;
                value_met.component[COMPLEXITY].value = val_complexity;
                value_met.component[MAINTENACE].value = val_maintenance;
                //Calculo sobre 5

                // console.log(cal_maintenance);
                // console.log(cal_complexity);
                cb();
            }, reject);
            /***********************************************************************************************************************************************/

            /******************************************************* METRIC 2: STRUCTURAL*******************************************************************/
            child_process.execFile('../metrics/imports-analyzer/countImports.py', ['-u', folder], function (error, stdout, stderr) {
                // var expression = /\d* imports \(totales \d*\)/;
                var expression = /(\d*) imports \(totales \d*\)/;
                var match_result = stdout.match(expression);
                number_imports = match_result.length > 1 ? parseInt(match_result[1]) : 0;

                if (number_imports > 0 && number_imports <= 25) {
                    calidad_estructural = 5;
                } else if (number_imports <= 40) {
                    calidad_estructural = 4.5;
                } else if (number_imports <= 55) {
                    calidad_estructural = 4;
                } else if (number_imports <= 60) {
                    calidad_estructural = 3;
                } else if (number_imports <= 70) {
                    calidad_estructural = 2;
                } else {
                    calidad_estructural = 1;
                }
                value_met.component[STRUCTURAL].value = calidad_estructural;
                //Calculo sobre 5
                cal_structural = calidad_estructural;
                cb();
            });
            /*************************************************************************************************************************************************/

            /******************************************************** METRIC 3: USABILITY ********************************************************************/
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
            /***********************************************************************************************************************************************/

            /******************************************************** METRIC 4: SECURITY *******************************************************************/
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
            /***********************************************************************************************************************************************/

            /******************************************************** METRIC 5: ACCURACY *******************************************************************/
            // child_process.execFile('../metrics/accuracy/accuracy_metric.py', ['open-weather', 'master'], function (error, stdout, stderr) {
            //     var contadorFallos = /contadorFallos (.*)/;
            //     var fallos_accuracy = stdout.match(contadorFallos);
            //     console.log(fallos_accuracy)
            //     console.log("fallos contador:")
            //     //console.log (fallos_accuracy[0]);
            //     //value_met.component[ACCURACY].value = fallos_accuracy[0];
            //     cb();
            //     console.log(stdout);
            // });
            /***********************************************************************************************************************************************/

            /******************************************************** QUALITY *******************************************************************/




            // var calidad_total = (cal_usability + cal_accuracy + cal_latency + cal_complexity + cal_maintenance + cal_structural  + cal_security)/8;
            // var calidad_total = (cal_usability2 + cal_accuracy2 + cal_latency2 + cal_complexity2 + cal_maintenance2 + cal_structural2  + cal_security2 + cal_refresh2)/8;
            // console.log("La calidad del componente es: " + calidad_total);

            // function quality(){
            //     switch (rol_selected) {
            //         case "proveedor":
            //             calidad_total = (1.5*cal_usability2 + cal_accuracy2 + cal_latency2 + cal_complexity2 + 2.5*cal_maintenance2 + cal_structural2  + 1.5*cal_security2 + cal_refresh2)/10.5;
            //             // calidad_total = 1
            //             break;
            //         case "notecnico":
            //             calidad_total = (cal_usability2 + cal_accuracy2 + cal_latency2 + cal_complexity2 + cal_maintenance2 + cal_structural2  + cal_security2 + cal_refresh2)/8;
            //             break;
            //         case "integrador":
            //             calidad_total = (2*cal_usability2 + cal_accuracy2 + cal_latency2 + cal_complexity2 + 2.3*cal_maintenance2 + cal_structural2  + 2*cal_security2 + cal_refresh2)/11.3;;
            //             break;
            //         default:
            //             calidad_total = (2*cal_usability2 + cal_accuracy2 + cal_latency2 + cal_complexity2 + 2.5*cal_maintenance2 + cal_structural2  + cal_security2 + cal_refresh2)/10.5;;
            //     }
            //     console.log(calidad_total);                
            // }
        });

    },
    quality: function (valores) {
        var calidad_total;
        var cal_maintenance, cal_accuracy, cal_complexity, cal_latency, cal_refresh, cal_security, cal_usability, cal_structural;
        var val_latency = valores.component[0].value;
        var val_structural = valores.component[1].value;
        var val_complexity = valores.component[2].value;
        var val_maintenance = valores.component[3].value;
        var val_accuracy = valores.component[4].value;
        var val_usability = valores.component[5].value;
        var val_security = valores.component[6].value;
        var val_refresh = valores.component[7].value;

        /* COMPLEXITY*/
        if (val_complexity > 0 && val_complexity < 11) {
            cal_complexity = 5;
        } else if (val_complexity < 21) {
            cal_complexity = 4;
        } else if (cal_complexity < 51) {
            cal_complexity = 3;
        } else {
            cal_complexity = 2;
        }

        /* ACCURACY */
        if (val_accuracy < 20) {
            cal_accuracy = 5;
        } else if (val_accuracy < 40) {
            cal_accuracy = 4;
        } else if (val_accuracy < 60) {
            cal_accuracy = 3;
        } else if (val_accuracy < 80) {
            cal_accuracy = 2;
        } else {
            cal_accuracy = 1;
        }

        /* MAINTENANCE*/
        cal_maintenance = (val_maintenance * 5) / 100;
        /* STRCUTRUAL*/
        cal_structural = val_structural;
        /*LATENCY*/
        if (val_latency <= 1000) {
            cal_latency = 5;
        } else if (val_latency <= 3000) {
            cal_latency = 4;
        } else if (val_latency <= 7000) {
            cal_latency = 3;
        } else if (val_latency <= 9000) {
            cal_latency = 2;
        } else {
            cal_latency = 1;
        }
        /* REFRESH*/
        if (val_refresh < 50) {
            cal_refresh = 5;
        } else if (val_refresh < 55) {
            cal_refresh = 4;
        } else if (val_refresh < 65) {
            cal_refresh = 3;
        } else if (val_refresh < 80) {
            cal_refresh = 2;
        } else {
            cal_refresh = 1;
        }
        /* SECURITY*/
        cal_security = val_security;
        /* USABILITY*/
      
        if (val_usability <= 0.20) {
            cal_usability = 1;
        } else if (val_usability <= 0.40) {
            cal_usability = 2;
        } else if (val_usability <= 0.60) {
            cal_usability = 3;
        } else if (val_usability <= 0.80) {
            cal_usability = 4;
        } else {
            cal_usability = 5;
        }

        console.log(cal_complexity);
        console.log(cal_accuracy);
        console.log(cal_maintenance);
        console.log(cal_structural);
        console.log(cal_latency);
        console.log(cal_refresh);
        console.log(cal_security);
        console.log(cal_usability);
        // switch (rol_selected) {
        //     case "proveedor":
        //         calidad_total = (1.5 * cal_usability + cal_accuracy + cal_latency + cal_complexity + 2.5 * cal_maintenance + cal_structural + 1.5 * cal_security + cal_refresh) / 10.5;
        //         // calidad_total = 1
        //         break;
        //     case "notecnico":
        //         calidad_total = (cal_usability + cal_accuracy + cal_latency + cal_complexity + cal_maintenance + cal_structural + cal_security + cal_refresh) / 8;
        //         break;
        //     case "integrador":
        //         calidad_total = (2 * cal_usability + cal_accuracy + cal_latency + cal_complexity + 2.3 * cal_maintenance + cal_structural + 2 * cal_security + cal_refresh) / 11.3;;
        //         break;
        //     default:
        //         calidad_total = (2 * cal_usability + cal_accuracy + cal_latency + cal_complexity + 2.5 * cal_maintenance + cal_structural + cal_security + cal_refresh) / 10.5;;
        // }
        // console.log(calidad_total);
    }
};


