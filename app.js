var createError = require('http-errors');
const express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

/*import React from 'react';
import Canvas from './Canvas';
import SocketIOClient from 'socket.io-client';
*/

const http= require('http');
//const port = 3000;
const app = express();



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const port = process.env.PORT || 3000;

const server = http.createServer(app).listen(port, () => {
  console.log(`Server-- listening on port ${port}`);

});
const io = require('socket.io')(server);
  io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('draw', (data) => {
      console.log('Received draw data:', data);
      // Broadcast or send data to specific clients as needed
      socket.broadcast.emit( 'draw', data );
      console.log('Broadcast of the data attempted for ',data.type);
      io.emit('draw', data);
    });
  
    

    socket.on( 'rectData', function( data ) {
      console.log( 'draw rectangle event recieved 1:', data );
    })
    io.on( 'rectData', function( data ) {
      console.log( 'draw rectangle event recieved 1:', data );
    })
    

  io.on('disconnect', (socket) => {
      console.log('A user disconnected');
    });
});


app.listen(0, 'localhost', () => {
  const address = server.address();
  const port = address.port;
  console.log(`Server listening on port ${port}`);
});

var cons = require('consolidate');
const { url } = require('inspector');

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
console.log(`ejs engine set`);

app.get('/', (req, res) => {
  res.render('index', { title: 'DrawLab- Collaborative Drawing Appication' });
  console.log('Incoming request:', req.url);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
  res.render('error', { title: 'Error', message: err.message, error: err });
  //res.render('error');
});

module.exports = app;