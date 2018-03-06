var express = require('express');
var db = require('../services/mydb').getInstance();
var router = express.Router();
var mongoose = require('mongoose');

/* GET users listing. */
router.get('/', function (req, res, next) {
  mongoose.connect(db, function (err, db) {
    if (err) {
      throw new Error(err);
    }
    var cursor = db.collection('component').find({}, {"attributes":1, "_id":0})
    cursor.toArray(function(err, docs){
      if (err){
        res.send(err).status(400);
        db.close();
      } else {
        res.send(docs.map(function(doc){
          var res = doc.attributes + doc.component_id;
          return res;
        }));
        db.close();    
      }
    });

  }, function(){
    res.send('No se puede conectar con la base de datos').status(400);
  });
});

module.exports = router;
