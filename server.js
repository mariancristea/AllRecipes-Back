var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    methods = require('methods'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    cors = require('cors'),
    passport = require('passport'),
    errorhandler = require('errorhandler'),
    cookieParser = require('cookie-parser'),
    mongoose = require('mongoose');
    require('./models/User');
  
    process.env.SECRET = "secret";
    var sessionOpts = {
      saveUninitialized: true, // saved new sessions
      resave: false, // do not automatically write to the session store
      
      secret: 'conduit',
      cookie : { httpOnly: true, maxAge: 2419200000 } // configure when sessions expires
    }
var isProduction = process.env.NODE_ENV === 'production';

// Create global app object


var app = express();
var corsOptions = {
  origin : 'http://localhost:4200',
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "credentials": true,
  "optionsSuccessStatus": 204
}
app.use(cors(corsOptions));

app.options('*', cors(corsOptions))

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require('method-override')());

app.use(session(sessionOpts))
app.use(passport.initialize())



if (!isProduction) {
  app.use(errorhandler());
}

if(isProduction){
  mongoose.connect(process.env.MONGODB_URI);
} 
require('./models/User');
require('./config/passport');

app.use(require('./routes'));

/// catch 404 and forward to error handler

var server = app.listen( process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});