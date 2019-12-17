var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

const config = require('./app_server/config/database');//importing the database
const mongoose = require('mongoose');
const session = require('express-session');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const passport = require('passport');

var routes= require("./app_server/routes/index");

mongoose.connect('mongodb://localhost:27017/nodekb');
let db = mongoose.connection;
//check connection
db.once('open', function(){
    console.log("Connected to mongodb in app.js");
});
//Check for db errors
db.on('error', function(err){
    console.log(err);
    console.log("Connection failed in app.js");
});

var app = express();

app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Express Session Middleware
app.use(session({
  secret: 'another awkward secret',
  resave: true,
  saveUninitialized: true
})
);

//Express Messages Middleware
//storing message from req body in local variable
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


//Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value){
      var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

      while(namespace.length){
          formParam += '[' + namespace.shift() + ']';
      }
      return{
          param : formParam,
          msg : msg,
          value : value
      };
  }
}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

//Passport config
require('./app_server/config/passport')(passport);
//Passport Middlewere
app.use(passport.initialize());
app.use(passport.session());

//to get logedin user in a local variable
app.get('*', function(req, res, next){//* is used for all routes
  res.locals.user = req.user ||null;
  console.log("here is the local "+res.locals.user);
  next();
});

//let all routes controlled by the index route.
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;
