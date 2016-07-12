'use strict';

window.twttr = (function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
  if (d.getElementById(id))
    return t;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);
 
  t._e = [];
  t.ready = function(f) {
    t._e.push(f);
  };
 
  return t;
}(document, "script", "twitter-wjs"));

var TwitterReceiver = function (config, endpoint) {
  this.config = config;
  this.on_tweet = null; // Callback prototype `function (tweet_obj)`

  this.start = function () {
    this._socket = new WebSocket(this._endpoint);

    this._socket.onerror = this._socket_on_error;
    this._socket.onopen = this._socket_on_open;
    this._socket.onmessage = this._socket_on_message;
    this._socket.onclose = this._socket_on_close;
  };

  this.stop = function () {
    if (this._socket == null)
      return;

    // Close the socket.
    this._socket.close();
    this._socket = null;
  };

  // Internal
  this._config = config;
  this._endpoint = endpoint;
  this._socket = null;


  var self = this;

  // Handle any errors that occur.
  this._socket_on_error = function (error) {
    var message = 'WebSocket error: ' + error;
    console.error(message);
    self.stop();
    
    // Reconnect?
    if (self._config['reconnect_on_error'])
      setTimeout(self.start, self._config['retry_connection_interval']);
  };

  // Show a connected message when the WebSocket is opened.
  this._socket_on_open = function (event) {
    var message = 'Connected to: ' + self._endpoint;
    console.log(message);
    //socketStatus.className = 'open';
  };

  // Handle messages sent by the server.
  this._socket_on_message = function (event) {
    var message = event.data;
    //console.log('Message: ' + message);

    var obj = null;
    try {
      obj = JSON.parse(message);
    } catch (e) {
      console.error('Failed to parse tweet: ' + e.message);
    }

    if (typeof self.on_tweet === 'function')
      self.on_tweet(obj);
  };

  // Show a disconnected message when the WebSocket is closed.
  this._socket_on_close = function (event) {
    var message = 'WebSocket disconnected from ' + self._endpoint;
    console.log(message);
    //socketStatus.className = 'closed';
  };
};