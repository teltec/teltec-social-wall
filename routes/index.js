var express = require('express');
var router = express.Router();
const fs = require('fs');

var hashtags = [
  '#NodeJS',
  '#Twitter',
  '#Instagram',
];

//
// WebSocket
//

var ws_clients = {
  '/ws/twitter': [],
  '/ws/instagram': [],
};
var websocket = require('nodejs-websocket');

var ws_options = {};
if (process.env.USE_HTTPS) {
  ws_options = {
    secure: true,
    key: fs.readFileSync(process.env.HTTPS_KEY),
    cert: fs.readFileSync(process.env.HTTPS_CERT),
  };
}

var ws_server = websocket.createServer(ws_options, function (conn) {
  console.log('websocket: New connection via ' + conn.path);
  if (!ws_clients.hasOwnProperty(conn.path)) {
    conn.sendText('ERROR: Unhandled path ' + conn.path);
    return;
  }

  ws_clients[conn.path].push(conn);

  conn.on("close", function (code, reason) {
    console.log("websocket: Connection closed");
    var pos = ws_clients[conn.path].indexOf(conn);
    if (pos !== -1) {
      ws_clients[conn.path].splice(pos, 1);
    }
  });

  //conn.on("text", function (str) {
  //  console.log('websocket: Received ' + str);
  //});
}).listen(8001);

var ws_broadcast = function (server, path, msg) {
  if (!ws_clients.hasOwnProperty(path)) {
    console.error('Invalid path for ws_clients: ' + path);
    return;
  }
  //server.connections.forEach(function (conn) {
  ws_clients[path].forEach(function (conn) {
    conn.sendText(msg);
  });
};

//
// Routes
//

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Teltec Social Wall',
    messages: [],
    hashtags: hashtags.join(' '),
  });
});

router.get('/privacy', function (req, res, next) {
  res.render('privacy', {
    title: 'Privacy Policy',
    messages: [],
  });
});

//
// Twitter initialization
//

var TwitterClient = require('../lib/twitter-client.js');
var twitter = new TwitterClient(router);
setTimeout(function () {
  twitter.stream_statuses(hashtags, function (tweet) {
    ws_broadcast(ws_server, '/ws/twitter', JSON.stringify(tweet));
  });
}, 5000);

//
// Instagram initialization
//

var InstagramClient = require('../lib/instagram-client.js');
var instagram = new InstagramClient(router);
setTimeout(function () {
  instagram.stream_medias(hashtags, function (media) {
    ws_broadcast(ws_server, '/ws/instagram', JSON.stringify(media));
  });
}, 5000);

//
// Handle exit properly
//

process.stdin.resume(); // Make the program not close instantly.

function exit_handler(options, err) {
  if (options.cleanup) {
    console.log('Cleaning up...');

    // Custom cleanup
    if (ws_server != null)
      ws_server.close();
  }
    
  if (err)
    console.error(err.stack);

  if (options.exit) {
    console.log('Exiting...')
    process.exit();
  }
}

// Do something when app is closing
process.on('exit', exit_handler.bind(null, { cleanup: true }));
// Catches ctrl+c event
process.on('SIGINT', exit_handler.bind(null, { exit: true }));
// Catches uncaught exceptions
process.on('uncaughtException', exit_handler.bind(null, { exit:true }));

module.exports = router;
