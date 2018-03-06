var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.senfFile(path.join(__dirname, '../../../app', 'index.html'));
  res.sendFile('index.html', { root: path.join(__dirname, '../../../app') });
});

module.exports = router;
