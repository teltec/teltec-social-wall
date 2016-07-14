'use strict';

var WebsocketClient = function (name, config, endpoint) {
  this._config = config;
  this._name = name;
  this.on_item = null; // Callback prototype `function (item_obj)`

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
      console.error('Failed to parse ' + self._name + ' message: ' + e.message);
    }

    if (typeof self.on_item === 'function')
      self.on_item(obj);
  };

  // Show a disconnected message when the WebSocket is closed.
  this._socket_on_close = function (event) {
    var message = 'WebSocket disconnected from ' + self._endpoint;
    console.log(message);
    //socketStatus.className = 'closed';
    if (self._config['reconnect_on_close'])
      setTimeout(self.start, self._config['retry_connection_interval']);
  };
};

WebsocketClient.prototype.start = function () {
  this._socket = new WebSocket(this._endpoint);

  this._socket.onerror = this._socket_on_error;
  this._socket.onopen = this._socket_on_open;
  this._socket.onmessage = this._socket_on_message;
  this._socket.onclose = this._socket_on_close;
};

WebsocketClient.prototype.stop = function () {
  if (this._socket == null)
    return;

  // Close the socket.
  this._socket.close();
  this._socket = null;
};
