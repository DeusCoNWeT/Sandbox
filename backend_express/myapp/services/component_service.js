var db = require('./mydb').getInstance();
var mongoose = require('mongoose');
module.exports = {
    get_component: function (id) {
        return new Promise(function (resolve, reject) {
            mongoose.connect(db, function (err, db) {
                if (err) {
                    reject(err);
                    return;
                }
                //FILTRO BIEN?
                var name_component = db.collection('component').find({ component_id: id }, { "attributes": 1, "_id": 0 });
                
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
    }
};


