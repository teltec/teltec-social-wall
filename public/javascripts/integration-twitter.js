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

var BadwordsFilter = function () {
  this._badwords_regex = [];

  // Pre-build a RegExp object for each badword in order to
  // avoid creating it for every test.
  this.build_badwords_filters = function () {
    var complete_list = global_badwords.concat([
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

$(document).ready(function() {
  var _config = {
    'max_visible_items': 6,
    'update_interval': 5000, // In milliseconds
    'websocket_retry_connection_interval': 5000, // In milliseconds
  };

  var _state = {
    'updating': true,
  };

  var badwordsFilter = new BadwordsFilter();

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

  var _endpoint = 'ws://live-tweets.mybluemix.net/ws/tweets/teltec';
  var _socket;
  var _visible_items = [];
  var _queued_items = [];

  var connect_to_live_tweets = function () {
    _socket = new WebSocket(_endpoint);
    _socket.onerror = _socket_onerror;
    _socket.onopen = _socket_onopen;
    _socket.onmessage = _socket_onmessage;
    _socket.onclose = _socket_onclose;
  };

  // Handle any errors that occur.
  var _socket_onerror = function (error) {
    var message = 'WebSocket error: ' + error;
    console.error(message);
    // Close the socket, just in case.
    _socket.close();
    // Reconnect!
    setTimeout(connect_to_live_tweets, _config['websocket_retry_connection_interval']);
  };

  // Show a connected message when the WebSocket is opened.
  var _socket_onopen = function (event) {
    var message = 'Connected to: ' + _endpoint;
    console.log(message);
    //socketStatus.className = 'open';
  };

  // Handle messages sent by the server.
  var _socket_onmessage = function (event) {
    var message = event.data;
    //console.log('Message: ' + message);
    try {
      var obj = JSON.parse(message);
      received_tweet(obj);
    } catch (e) {
      console.error('Failed to parse tweet: ' + e.message);
    }
  };

  // Show a disconnected message when the WebSocket is closed.
  var _socket_onclose = function (event) {
    var message = 'WebSocket disconnected from ' + _endpoint;
    console.log(message);
    //socketStatus.className = 'closed';
    // Reconnect!
    setTimeout(connect_to_live_tweets, _config['websocket_retry_connection_interval']);
  };

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

  var build_tweet_widget = function ($element, obj, on_complete) {
    build_tweet_widget_native($element, obj, on_complete);
    $element.attr('data-timestamp', obj.tweet.timestamp_ms);
  };

  var received_tweet = function (tweet_obj) {
    var tweet_text = tweet_obj.tweet.text;
    if (badwordsFilter.contains_badword(tweet_text)) {
      console.log('Discaring tweet from @' + tweet_obj.tweet.user.screen_name + ' due to badwords: ' + tweet_text);
      return;
    }

    _queued_items.push(tweet_obj);
    console.log('Queued a new tweet: ' + _queued_items.length + ' queued');
  };

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
  connect_to_live_tweets();
  badwordsFilter.build_badwords_filters();
});