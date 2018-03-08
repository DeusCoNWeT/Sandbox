var express = require('express');
var api_controller = express();
var mongoose = require('mongoose');
var db = require('../services/mydb').getInstance();
var handler_db = {
    properties_components: function (req, res, next) {
        mongoose.connect(db, function (err, db) {
          if (err) {
            throw new Error(err);
          }
          var cursor = db.collection('component').find({}, { "attributes": 1, "_id": 0 })
          cursor.toArray(function (err, docs) {
            if (err) {
              res.send(err).status(400);
              db.close();
            } else {
              res.json(docs.map(function (doc) {
                return {
                  attributes: JSON.parse(doc.attributes),
                  name: doc.component_id
                }
              }));
              db.close();
            }
          });
      
        }, function () {
          res.send('No se puede conectar con la base de datos').status(400);
        });
      }
    }
module.exports = handler_db;