

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var assert = require('assert')
//Import the mongoose module
var mongoose = require('mongoose');


var index = require('./routes/index');
var users = require('./routes/users');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../app')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const config = require('./config.json');
const host = config.mongodb.host;
const user = config.mongodb.user;
const password = config.mongodb.password;
const name = config.mongodb.name;
const port = config.mongodb.port;

app.use(function(req, res, next){
//Set up default mongoose connection
mongoDB = mongoose.connect('mongodb://' + user +":"+password+ "@"+ host+":"+port +"/" + name);
mongoose.connect(mongoDB, function(err, db){
  assert.equal(null,err);
  // db.collection('components').
  var resultArray = [];
  console.log(resultArray);
  var cursor = db.collection('components').find();
  cursor.forEach(function(doc,err){
    assert.equal(null,err);
    resultArray.push(doc);
    console.log(resultArray);
  },function(){
    console.log(resultArray);
    db.close();
    // res.render('index.html')
  });
});
});


// atrList = []
// nameComp =[]
// for comp in Component.objects:
//      atrList.append(comp.attributes)
//      nameComp.append(comp.component_id)
//     CompAtrDict= dict(zip(nameComp,atrList))
// f = codecs.open("../../../app/index.html",'r')
// import ipdb; ipdb.sset_trace()



// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = app;
