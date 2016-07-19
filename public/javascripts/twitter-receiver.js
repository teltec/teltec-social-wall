'use strict';

window.twttr = (function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0], t = window.twttr || {};
  if (d.getElementById(id))
    return t;
  js = d.createElement(s);
  js.id = id;
  js.src = 'https://platform.twitter.com/widgets.js';
  fjs.parentNode.insertBefore(js, fjs);
 
  t._e = [];
  t.ready = function (f) {
    t._e.push(f);
  };
 
  return t;
}(document, 'script', 'twitter-wjs'));

var TwitterReceiver = function (config, endpoint) {
  WebsocketClient.call(this, 'Twitter', config, endpoint);
};

TwitterReceiver.prototype = Object.create(WebsocketClient.prototype);
TwitterReceiver.prototype.constructor = TwitterReceiver;
