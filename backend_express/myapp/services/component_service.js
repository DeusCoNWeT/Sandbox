var report = require('../metrics/polymer-complexity/src/Report');
// USING CHILD_PROCESS (for execute bash)
var child_process = require('child_process');
var path = require('path');
var db = require('./mydb').getInstance();
var mongoose = require('mongoose');
var LATENCY = 0, STRUCTURAL = 1, COMPLEXITY = 2, MAINTENACE = 3, ACCURACY = 4, USABILITY = 5, SECURITY = 6, REFRESH = 7;
var SPOTIFY = 0, TWITTER = 1, TRAFFIC = 2, PINTEREST = 3, WEATHER = 4, GOOGLE_PLUS = 5, FINANCE_SEARCH = 6, FACEBOOK = 7;
var MAX_CONT = 2;

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
                    value: 45.2
                },
                {
                    name: "usability",
                    value: ""
                },
                {
                    name: "security",
                    value: 45.2
                },
                {
                    name: "refresh",
                    value: 45.2
                }

            ]
        }
        //llamar al script de las metricas

        var base_folder = path.join(__dirname, '../components/bower_components/');
        //Tenemos que tener en la respuesta el nombre del componente para saber donde entrar en bower components
        //var component = 'spotify-component-stable/spotify-component.html';
        //var component = 'twitter-timeline-stable/static/twitter-timeline.html';
        var list_folder = ['spotify-component-stable/spotify-component.html', 'twitter-timeline-stable/static/twitter-timeline.html', 'traffic-incidents-stable/traffic-incidents.html',
        'pinterest-timeline-stable/pinterest-timeline.html','open-weather-stable/open-weather.html','googleplus-timeline-stable/googleplus-timeline.html','finance-search-stable/finance-search.html',
        'facebook-wall-stable/facebook-wall.html'];
        var list_folder_demo = ['spotify-component-stable/', 'twitter-timeline-stable/static/', 'traffic-incidents-stable/',
        'pinterest-timeline-stable/','open-weather-stable/','googleplus-timeline-stable/','finance-search-stable/',
        'facebook-wall-stable/'];
        // FALTA REDDIT
        // Hay que hacer que el objeto que traemos tenga el nombre del componente, y aqui lo comprobamos si ese nombre contiene una lapabra de spoty, twitter etc..
        
        // var component = list_folder[3];
        var new_index = 'demo/index.html';
        var component;
        var component_demo;
        ////////////////////////////// FOLDER OF COMPONENTS////////////////////////////////////////
        var name_comp = object_tokens.nameComp;
        if(name_comp.includes('spotify')){
            component = list_folder[SPOTIFY];
            component_demo = list_folder_demo[SPOTIFY];
            new_index = 'index.html';   
        }else if(name_comp.includes('twitter')){
            component = list_folder[TWITTER];
            component_demo = list_folder_demo[TWITTER];
        }else if(name_comp.includes('facebook')){
            component = list_folder[FACEBOOK];
            component_demo = list_folder_demo[FACEBOOK];
            new_index = 'demo.html';
        }else if(name_comp.includes('google')){
            component = list_folder[GOOGLE_PLUS];
            component_demo = list_folder_demo[GOOGLE_PLUS];
        }else if(name_comp.includes('finance')){
            component = list_folder[FINANCE];
            component_demo = list_folder_demo[FINANCE];
        }else if(name_comp.includes('weather')){
            component = list_folder[WEATHER];
            component_demo = list_folder_demo[WEATHER];
        }else if(name_comp.includes('pinterest')){
            component = list_folder[PINTEREST];
            component_demo = list_folder_demo[PINTEREST];
        }else{
            component = list_folder[TRAFFIC];
            component_demo = list_folder_demo[TRAFFIC];
        }
        
        var folder = base_folder + component;
        var index_component = base_folder + component_demo + new_index;
        
        return new Promise(function (resolve, reject) {
            function contador(max){
                var cont = 0;
                return function(){
                    cont++;
                    if (cont === max){
                        resolve(value_met);
                    }
                }
            }
            var cb = contador(MAX_CONT);
            
            // METRIC 1: COMPLEXITY y MANTENIBILIDAD
            report.analyze(folder).then(function (result) {
                var val_complexity = result.js[0].complexity.methodAverage.cyclomatic;
                var val_maintenance = result.js[0].complexity.maintainability;
                value_met.component[COMPLEXITY].value = val_complexity;
                value_met.component[MAINTENACE].value = val_maintenance;
                cb();
                
            }, reject);
             // METRIC 2: STRUCTURAL
            child_process.execFile('../metrics/imports-analyzer/countImports.py', ['-u', folder], function(error, stdout, stderr){
                var expression = /\d* imports \(totales \d*\)/;
                var number_imports = stdout.match(expression);
                console.log(number_imports);
                console.log(stdout);
                value_met.component[STRUCTURAL].value = number_imports;
                cb();
            });
            console.log('/////////');
            // console.log(index_component);
            var salida = child_process.execFile('../metrics/polymer-accessibility/acc', [index_component], function(error, stdout, stderr){
                // var expression = /\d* imports \(totales \d*\)/;
                // var number_imports = stdout.match(expression);
                // console.log(number_imports);
                console.log(index_component);
                console.log(salida);
                // value_met.component[STRUCTURAL].value = number_imports;
                // cb();
            });
         });
    }
};


