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

var BadwordsFilter = function (array_of_badwords) {
  this._badwords_regex = [];

  // Pre-build a RegExp object for each badword in order to
  // avoid creating it for every test.
  this.build_badwords_filters = function () {
    var complete_list = array_of_badwords.concat([
      'DILMA',
      'CUNHA',
      'PSDB',
    ]);

    for (var i = 0; i < complete_list.length; i++) {
      this._badwords_regex.push(new RegExp(complete_list[i], 'ig'));
    }
  };

  this.contains_badword = function (tweet_text) {
    for (var i = 0; i < this._badwords_regex.length; i++) {
      var unaccented = removeDiacritics(tweet_text);
      var re = this._badwords_regex[i];
      //console.log('re = ' + re + ', unaccented = ' + unaccented);
      var result = unaccented.match(re);
      if (result) {
        //console.log('Matched: ' + result);
        return true;
      }
    }
    return false;
  };
};

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

$(document).ready(function () {
  //
  // Config form
  //

  var _config = {
    'max_visible_items': 6,
    'update_interval': 5000, // In milliseconds
    'reconnect_on_error': true,
    'retry_connection_interval': 5000, // In milliseconds
  };

  var _state = {
    'updating': true,
  };

  $('.config-form').on('submit', function (event) {
    event.preventDefault();
    if (!document.activeElement.name)
      return;
    var $button = $(this).find('[name=' + document.activeElement.name + ']');
    var action = $button.attr('name');
    switch (action) {
      case 'save':
        update_config($(this));
        break;
      case 'stop':
        var updating = _state['updating'];
        if (updating) {
          $button.text("{% trans 'Start' %}");
          _state['updating'] = false;
        } else {
          $button.text("{% trans 'Stop' %}");
          _state['updating'] = true;
          setTimeout(track_and_update_visible_items, _config['update_interval']);
        }
        break;
    }
    $('.config-panel').toggle();
  });

  var populate_config_form = function () {
    for (var key in _config) {
      if (_config.hasOwnProperty(key)) {
        $('.config-form').find('.config[data-item='+key+']').each(function (i, elem) {
          $(elem).val(_config[key]);
        });
      }
    }
  };

  var on_config_property_update = function (property_name) {
    switch (property_name) {
      case 'title':
        $('.live-tweets-title').text(_config['title']);
        break;
    }
  };

  var update_config = function($form) {
    $form.find('.config[data-item]').each(function (i, elem) {
      var $elem = $(elem);
      var property = $elem.attr('data-item');
      var value = $elem.val();
      var type = $elem.attr('data-type');
      switch (type) {
        default: break;
        case 'float':
          _config[property] = parseFloat(value);
          break;
        case 'int':
          _config[property] = parseInt(value);
          break;
        case 'str':
          _config[property] = value;
          break;
      }
      on_config_property_update(property);
    });
    console.log('Saved config: ' + JSON.stringify(_config));
  };

  //
  // Badwords
  //

  var badwords_filter = new BadwordsFilter(global_badwords);

  //
  // Twitter
  //

  var twitter_receiver = new TwitterReceiver(_config, 'ws://live-tweets.mybluemix.net/ws/tweets/teltec');

  var clone_tweet_template = function () {
    var $cloned_element = $('.social-templates .tweet-template-native .tweet-item').clone();
    return $cloned_element;
  };

  var build_tweet_widget_native = function ($element, obj, on_complete) {
    twttr.widgets.createTweet(
      obj.tweet.id_str,
      $element[0],
      {
        align: 'left'
      }
    ).then(function (el) {
      //console.log("Tweet has been displayed.");
      if (typeof on_complete === 'function')
        on_complete();
    });
  };

  twitter_receiver.on_tweet = function (tweet_obj) {
    var tweet_text = tweet_obj.tweet.text;
    if (badwords_filter.contains_badword(tweet_text)) {
      console.log('Discaring tweet from @' + tweet_obj.tweet.user.screen_name + ' due to badwords: ' + tweet_text);
      return;
    }

    _queued_items.push(tweet_obj);
    console.log('Queued a new tweet: ' + _queued_items.length + ' queued');
  };

  var build_tweet_widget = function ($element, obj, on_complete) {
    build_tweet_widget_native($element, obj, on_complete);
    $element.attr('data-timestamp', obj.tweet.timestamp_ms);
  };

  //
  // Presentation
  //

  var _visible_items = [];
  var _queued_items = [];

  function track_and_update_visible_items() {
    if (!_state['updating'])
      return;

    // Re-schedule execution.
    setTimeout(track_and_update_visible_items, _config['update_interval']);

    if (_queued_items.length === 0)
      return;

    // Remove some visible items if the count exceeds `max_visible_items`.
    var extra = _visible_items.length - _config['max_visible_items'];
    if (extra > 0)
      console.log('Removing ' + extra + ' extra items');
    for (var i=0; i<extra; i++) {
      window.socialGrid.pop_front();
      _visible_items.shift(); // Remove more elements.
    }

    var count = _visible_items.length;

    console.log('Presenting a new item! Was showing exactly ' + count);

    var new_item_obj = _queued_items.shift(); // Remove first element.

    _visible_items.push(new_item_obj);

    // Check whether the item is from Twitter or Instagram
    var $new_item_element = clone_tweet_template();
    build_tweet_widget($new_item_element, new_item_obj, function () { window.socialGrid.updateLayout(); } );

    var is_full = count >= _config['max_visible_items'];

    if (is_full) {
      _visible_items.shift(); // Remove first element.

      window.socialGrid.pop_front(function () {
        window.socialGrid.push_back($new_item_element);
      });
    } else {
      window.socialGrid.push_back($new_item_element);
    }
  };
  
  populate_config_form();
  track_and_update_visible_items();
  badwords_filter.build_badwords_filters();
  twitter_receiver.start();
});