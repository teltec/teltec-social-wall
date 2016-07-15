'use strict';

$(document).ready(function () {

  //
  // Config form
  //

  var _config = {
    'max_visible_items': 6,
    'update_interval': 5000, // In milliseconds
    'reconnect_on_error': true,
    'reconnect_on_close': true,
    'retry_connection_interval': 5000, // In milliseconds
    'networks': {
      'twitter': {
        'websocket': {
          'url': 'ws://' + window.location.hostname + ':8001/ws/twitter',
        }
      },
      'instagram': {
        'websocket': {
          'url': 'ws://' + window.location.hostname + ':8001/ws/instagram',
        }
      },
    }
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
          $button.text('Start');
          _state['updating'] = false;
        } else {
          $button.text('Stop');
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
        $('.social-wall-title').text(_config['title']);
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

  var twitter_receiver = new TwitterReceiver(_config, _config.networks['twitter'].websocket.url);

  twitter_receiver.on_item = function (item_obj) {
    var text = item_obj.text;
    if (badwords_filter.contains_badword(text)) {
      console.log('Discaring tweet from @' + item_obj.user.screen_name + ' due to badwords: ' + text);
      return;
    }

    _queued_items.push({ 'from': 'twitter', 'object': item_obj });
    console.log('Queued a new tweet: ' + _queued_items.length + ' queued');
  };

  var clone_tweet_template = function () {
    var $cloned_element = $('.social-templates .tweet-template-native .tweet-item').clone();
    return $cloned_element;
  };

  var build_tweet_widget_native = function ($element, obj, on_complete) {
    twttr.widgets.createTweet(
      obj.id_str,
      $element[0],
      {
        align: 'left'
      }
    ).then(function (el) {
      //console.log('Tweet has been displayed.');
      if (typeof on_complete === 'function')
        on_complete();
    });
  };

  var build_tweet_widget = function ($element, obj, on_complete) {
    build_tweet_widget_native($element, obj, on_complete);
    $element.attr('data-timestamp', obj.timestamp_ms);
  };

  //
  // Instagram
  //

  var instagram_receiver = new InstagramReceiver(_config, _config.networks['instagram'].websocket.url);

  instagram_receiver.on_item = function (item_obj) {
    var text = item_obj.caption.text;
    if (badwords_filter.contains_badword(text)) {
      console.log('Discaring insta from @' + item_obj.user.username + ' due to badwords: ' + text);
      return;
    }

    _queued_items.push({ 'from': 'instagram', 'object': item_obj });
    console.log('Queued a new insta: ' + _queued_items.length + ' queued');
  };

  var clone_instagram_template = function () {
    var $cloned_element = $('.social-templates .instagram-template-native .instagram-item').clone();
    return $cloned_element;
  };

  var build_instagram_widget_native = function ($element, obj, on_complete) {
    var media_obj = obj['oembed'];
    $element[0].style.width = '510px';
    $element[0].innerHTML = media_obj.html;
    $element[0].style.margin = '10px 10px 0px 0px';

    //console.log('Insta has been displayed.');
    if (typeof on_complete === 'function')
      on_complete();
  };

  var build_instagram_widget = function ($element, obj, on_complete) {
    build_instagram_widget_native($element, obj, on_complete);
    $element.attr('data-timestamp', obj.created_time);
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
      window.social_grid.pop_front();
      _visible_items.shift(); // Remove more elements.
    }

    var count = _visible_items.length;

    console.log('Presenting a new item! Was showing exactly ' + count);

    var new_item = _queued_items.shift(); // Remove first element.
    var new_item_from = new_item['from'];
    var new_item_obj = new_item['object'];
    
    _visible_items.push(new_item_obj);

    var $new_item_element = null;

    switch (new_item_from) {
      default:
        console.error('Unhandled item from ' + new_item_from);
        return;
      case 'twitter':
        // Check whether the item is from Twitter or Instagram
        $new_item_element = clone_tweet_template();
        build_tweet_widget($new_item_element, new_item_obj, function () { window.social_grid.update_layout(); } );
        break;
      case 'instagram':
        $new_item_element = clone_instagram_template();
        build_instagram_widget($new_item_element, new_item_obj, function () { window.social_grid.update_layout(); } );
        break;
    }

    var is_full = count >= _config['max_visible_items'];

    if (is_full) {
      _visible_items.shift(); // Remove first element.

      window.social_grid.pop_front(function () {
        window.social_grid.push_back($new_item_element);
      });
    } else {
      window.social_grid.push_back($new_item_element);
    }
  };
  
  populate_config_form();
  track_and_update_visible_items();
  twitter_receiver.start();
  window.social_grid.on_layout(function () {
    if (window.instgrm)
      window.instgrm.Embeds.process();
  });
  instagram_receiver.start();
});