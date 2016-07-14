var express = require('express');
var router = express.Router();
var util = require('util');
var ws = require('nodejs-websocket');
var InstagramFacade = require('./instagram-facade.js');

//
// WebSocket
//

var ws_server = ws.createServer(function (conn) {
  console.log('WebSocket: New connection');
  conn.on("text", function (str) {
    console.log('WebSocket: Received ' + str);
    conn.sendText(str.toUpperCase());
  })
  conn.on("close", function (code, reason) {
    console.log("WebSocket: Connection closed");
  })
}).listen(8001);

var ws_broadcast = function (server, msg) {
  server.connections.forEach(function (conn) {
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
  });
});

router.get('/privacy', function (req, res, next) {
  res.render('privacy', {
    title: 'Privacy Policy',
    messages: [],
  });
});

//
// Instagram initialization
//

var insta_config = {
  'client_id': process.env['IG_CLIENT_ID'],
  'client_secret': process.env['IG_CLIENT_SECRET'],
  'access_token': process.env['IG_ACCESS_TOKEN'],
  'redirect_uri': util.format('http:\/\/%s/api/instagram/auth', process.env['DOMAIN']),
};
var insta = new InstagramFacade(router, insta_config);
setTimeout(function () {
  insta.tag_media_recent('nature', function (media) {
    ws_broadcast(ws_server, JSON.stringify(media));
  });
}, 5000);

// insta.ig.user_media_recent({ count: 3 }, function (err, medias, pagination, remaining, limit) {
//   console.log(err);
// });

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
