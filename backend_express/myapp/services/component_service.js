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
                // Filter the attributes with the name component
                var name_component = db.collection('component').find({ component_id: id }, { "attributes": 1, "_id": 0 });

                name_component.toArray(function (err, docs) {
                    if (err) {
                        reject(err);
                        db.close();
                    } else {
                        resolve(docs.map(function (doc) {
                            if (!doc.isArray(doc) || doc.length == 0) {
                                reject(err);
                            } else {

                                return {
                                    attributes: JSON.parse(doc.attributes),
                                }
                            }
                        }));
                        db.close();
                    }
                });

            });

        })
    }
};


