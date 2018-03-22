var report = require('../metrics/polymer-complexity/src/Report');
var path = require('path');
var db = require('./mydb').getInstance();
var mongoose = require('mongoose');
var LATENCY = 1, COMPLEXITY = 2, MAINTENACE = 3, ACCURACY = 4, USABILITY = 5, SECURITY = 6, REFRESH = 7;

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
    analize_metric: function (object_tokens){
        var value_met = {
            component: [
                {
                    name:"latency",
                    value:45.2
                },
                {
                    name:"structural",
                    value:45.2
                },
                {
                    name:"complexity",
                    value:""
                },
                {
                    name:"maintencance",
                    value:""
                },
                {
                    name:"accuracy",
                    value:45.2
                },
                {
                    name:"usability",
                    value:45.2
                },
                {
                    name:"security",
                    value:45.2
                },
                {
                    name:"refresh",
                    value:45.2
                }

            ]
        }
        //llamar al script de las metricas
        
        var base_folder = path.join(__dirname, '../components/bower_components/');
        //Tenemos que tener en la respuesta el nombre del componente para saber donde entrar en bower components
        // var component = 'spotify-component-stable/spotify-component.html';
        var component = 'twitter-timeline-stable/static/twitter-timeline.html';
        
        
        return  new Promise(function(resolve, reject){
            var folder = base_folder + component;     
            // METRIC 1: COMPLEXITY y MANTENIBILIDAD
                report.analyze(folder).then(function(result){
                    var val_complexity = result.js[0].complexity.methodAverage.cyclomatic;
                    var val_maintenance = result.js[0].complexity.maintainability;
                    value_met.component[COMPLEXITY].value = val_complexity;
                    value_met.component[MAINTENACE].value = val_maintenance;
                   resolve(value_met);    
                },reject);
          });
    }
};


