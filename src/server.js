require('colors');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
app.use(express.static('./lib'));
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var uuid = require('node-uuid');

var imgPath = 'uploads/image';

app.use(bodyParser({ limit: '5mb'}));

var androidEndpoint = '/android';
var browserEndpoint = '/browser';

var sessionBrowsers = {};
var sessionAndroid = {};

var browsers = io.of(browserEndpoint);
browsers.on('connection', function(socket){
  console.log('Browser connected');

  //generate new session id here
  // var sessionId = uuid.v4();
  var sessionId = '123e4567-e89b-12d3-a456-426655440000';

  var androidWebsocketUrl = androidEndpoint + '/' + sessionId;
  var androidAppUrl = 'marims://' + androidWebsocketUrl;
  var browserUrl = sessionId;
  var browserWebsocketUrl = browserEndpoint + '/' + sessionId;

  //creating browser websocket listener for generated session
  sessionBrowsers[sessionId] = io.of(browserWebsocketUrl);
  sessionBrowsers[sessionId].on('connection', function(socket){
    console.log('Browser connected to session ' + sessionId);

  	socket.on('click', function(data){
  		console.log("clicked: x=" + data.xPos + " y=" + data.yPos);
      androidSocket = sessionAndroid[sessionId];
      androidSocket.emit('motionEvent', {
        x: data.xPos,
        y: data.yPos,
        event: "CLICK"
      });
  	});
  	socket.on('rightClick', function(data){
  		console.log("right clicked: x=" + data.xPos + " y=" + data.yPos);
      androidSocket = sessionAndroid[sessionId];
      androidSocket.emit('motionEvent', {
        x: data.xPos,
        y: data.yPos,
        event: "RIGHT_CLICK"
      });
  	});
  	socket.on('dragStart', function(data){
  		console.log("drag started: x=" + data.xPos + " y=" + data.yPos);
      androidSocket = sessionAndroid[sessionId];
      androidSocket.emit('motionEvent', {
        x: data.xPos,
        y: data.yPos,
        event: "DRAG_START"
      });
  	});
  	socket.on('mouseMove', function(data){
  		console.log("drag position: x=" + data.xPos + " y=" + data.yPos);
      androidSocket = sessionAndroid[sessionId];
      androidSocket.emit('motionEvent', {
        x: data.xPos,
        y: data.yPos,
        event: "MOUSE_MOVE"
      });
  	});
  	socket.on('mouseUp', function(data){
  		console.log("drag end: x=" + data.xPos + " y=" + data.yPos);
      androidSocket = sessionAndroid[sessionId];
      androidSocket.emit('motionEvent', {
        x: data.xPos,
        y: data.yPos,
        event: "MOUSE_UP"
      });
  	});

  });

  //creating android websocket listener for generated session
  // sessionAndroid[sessionId] = io.of(androidWebsocketUrl);
  // sessionAndroid[sessionId].on('connection', function(socket){
  //   console.log('Android connected to session ' + sessionId);
  //   socket.emit('start', 'android');
  // });

  //creating browser http listener for generated session
  app.get('/' + sessionId, function(req, res) {
    res.sendfile(path.resolve('src/session.html'));
  });

  //notifying that the session is ready to use
  socket.emit('sessionGenerated', {
    sessionId: sessionId,
    androidAppUrl: androidAppUrl,
    browserUrl: browserUrl,
    browserWebsocketUrl: browserWebsocketUrl 
  });

});

io.on('connection', function(socket){
  //Android connected
  socket.on('register', function(data){
    sessionAndroid[data.sessionId] = socket;
  });
  
});

var port = Number(process.env.PORT || 5000);
http.listen(port, function() {
  console.log(('Listening on ' + port).green);
});

app.get('/', function(req, res) {
  res.sendfile(path.resolve('src/index.html'));
});

app.post('/upload', function(req, res) {
  res.send('OK');
  sessionBrowsers[req.body.sessionId].emit('refresh', { 
    image: req.body.image,
    screenWidth: req.body.screenWidth,
    screenHeight: req.body.screenHeight
  });
});

app.get('/image', function(req, res){
  res.sendfile(path.resolve(imgPath));
});