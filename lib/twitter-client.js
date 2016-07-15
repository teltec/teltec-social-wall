require('./polyfill.js');
var Twitter = require('twitter');

var TwitterClient = function (router) {
  var self = this;

  var CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || 'CHANGE_ME';
  var CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || 'CHANGE_ME';
  var ACCESS_TOKEN_KEY = process.env.TWITTER_ACCESS_TOKEN_KEY || 'CHANGE_ME';
  var ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET || 'CHANGE_ME';

  var client = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET,
  });

  // Make sure the tag is in the format '#foo', with a preceding '#'.
  var sanitize_tag = function (tag) {
    if (typeof tag === 'string' || tag instanceof String)
      return tag.startsWith('#') ? tag : '#' + tag;
    
    console.error('Invalid tag: Should be a String');
    return null;
  };

  this.stream_statuses = function (tags, callback) {
    var filter = '';

    if (tags instanceof Array) {
      for (var i=0; i < tags.length; ++i) {
        tags[i] = sanitize_tag(tags[i]);
      }
      filter = tags.join();
    } else {
      filter = sanitize_tag(tags);
    }

    client.stream('statuses/filter', { track: filter }, function (stream) {
      stream.on('data', function (tweet) {
        //console.log(tweet);
        callback(tweet);
      });
     
      stream.on('error', function (error) {
        console.error(error);
        //throw error;
      });
    });
  };
};

module.exports = TwitterClient;
