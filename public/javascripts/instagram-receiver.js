'use strict';

window.instgrm_embeds = (function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0], t = window.instgrm_embeds || {};
  if (d.getElementById(id))
    return t;
  js = d.createElement(s);
  js.async = true;
  js.defer = true;
  js.id = id;
  js.src = '//platform.instagram.com/en_US/embeds.js';
  fjs.parentNode.insertBefore(js, fjs);
 
  t._e = [];
  t.ready = function (f) {
    t._e.push(f);
  };
 
  return t;
}(document, 'script', 'instgrm-wjs'));

var InstagramReceiver = function (config, endpoint) {
  WebsocketClient.call(this, 'Instagram', config, endpoint);
};

InstagramReceiver.prototype = Object.create(WebsocketClient.prototype);
InstagramReceiver.prototype.constructor = InstagramReceiver;
