
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var connection = require('./config/db');
const mongoose = require('mongoose')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin')
const cors = require('cors')
const dotenv = require("dotenv");
var deeplink = require('node-deeplink');

const swaggerUi = require('swagger-ui-express'),
  swaggerDocument = require('./swagger.json');
var app = express();
var fs = require('fs')
const http = require('http')
const https = require('https')
var socket = require('socket.io')
dotenv.config();
mongoose.connect(connection.Mongoconnection, { useNewUrlParser: true }, function (err) {
  if (err) throw err;
  else {
    console.log("Database connected successfully")
  }

})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/', express.static(path.join(__dirname, '/frontend/dist/frontend')));
app.use('/*', express.static(path.join(__dirname, '/frontend/dist/frontend')));

//global variable
global.baseURL = ''

app.use((req, res, next) => {
  baseURL = req.app.get('env') === 'development' ? "http://localhost:3531" : 'https://ss.stagingsdei.com:3531';
  next();
});


// app.use('/', indexRouter);
app.use('/api', usersRouter);
app.use('/api/admin', adminRouter);
app.use(expressSession({ secret: 'somesecrettokenhere' }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
app.get(
  '/deeplink',
  deeplink({
    fallback: 'https://cupsapp.com',
    android_package_name: 'com.citylifeapps.cups',
    ios_store_link:
      'https://itunes.apple.com/us/app/cups-unlimited-coffee/id556462755?mt=8&uo=4'
  })
);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  accountSid = process.env.accountSid
  authToken = process.env.authToken;
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


let httpsOptions = {
  key: fs.readFileSync('/home/jenkins/SSL/ss.key', 'utf8'),
  cert: fs.readFileSync('/home/jenkins/SSL/ss.crt', 'utf8'),
  ca: fs.readFileSync('/home/jenkins/SSL/ss.crt')
}
const server = https.Server(httpsOptions, app);

// const server = http.Server(app);




const io = socket(server);
require('./lib/socket')(io);
server.listen(3531)
module.exports = app;
