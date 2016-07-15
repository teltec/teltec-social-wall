require('./polyfill.js');
var request = require('request');
var util = require('util');
var Instagram = require('instagram-node');

var InstagramClient = function (router) {
  var self = this;
  var ig = Instagram.instagram();

  var CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || 'CHANGE_ME';
  var CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || 'CHANGE_ME';
  var ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || 'CHANGE_ME';
  var REDIRECT_URI = util.format('http:\/\/%s/api/instagram/auth', process.env.DOMAIN || 'localhost');

  ig.use({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    access_token: ACCESS_TOKEN,
  });

  this.authorize_user = function (req, res) {
    //console.log('DEBUG: authorize_user');
    res.redirect(ig.get_authorization_url(REDIRECT_URI, { scope: [ 'basic', 'public_content' ] }));
  };

  this.handle_auth = function (req, res) {
    //console.log('DEBUG: handle_auth');
    ig.authorize_user(req.query.code, REDIRECT_URI, function (err, result) {
      if (err) {
        //console.log(err);
        res.send('FAILED');
      } else {
        console.log('The generated access token is ' + result.access_token);
        res.send('SUCCESS');
      }
    });
  };

  var _cache_medias_by_id = {};

  var stream_medias_by_tag = function (tag_name, callback) {
    var skip_duplicates = true;
    var cache = _cache_medias_by_id;
    var response_handler = function (err, medias, pagination, remaining, limit) {
      if (err) {
        console.error(err);
        //throw err;
      } else {
        medias.forEach(function (media) {
          //console.log(media);
          var media_id = media['id'];
          //console.log("Received: " + media_id);
          // Skip medias that are already in cache.
          if (skip_duplicates && cache.hasOwnProperty(media_id))
            return;
          cache[media_id] = true;

          var url = util.format('https://api.instagram.com/oembed/?url=%s?OMITSCRIPT=true', media.link); 
          request(url, function (err, res, body) {
            if (typeof callback === 'function') {
              media['oembed'] = JSON.parse(body);
              callback(media);
            }
          });
        });
        
        var ONE_HOUR = 3600; // In seconds
        var run_after_millis = Math.ceil(ONE_HOUR / limit) * 1000;

        if (pagination.next) {
          pagination.next(response_handler); // Fetch next page results.
        } else {
          // Re-schedule!
          setTimeout(function () { stream_medias_by_tag(tag_name, callback); }, run_after_millis);
        }
      }
    };
    var result = ig.tag_media_recent(tag_name, {}, response_handler);
    return result;
  }

  // Make sure the tag is in the format 'foo', without a preceding '#'.
  var sanitize_tag = function (tag) {
    if (typeof tag === 'string' || tag instanceof String)
      return tag.startsWith('#') ? tag.substring(1) : tag;
    
    console.error('Invalid tag: Should be a String');
    return null;
  };

  this.stream_medias = function (tags, callback) {
    if (tags instanceof Array) {
      tags = tags.slice(0); // Clone the array.
      for (var i=0; i < tags.length; ++i) {
        tags[i] = sanitize_tag(tags[i]);
      }
      tags.forEach(function (tag) {
        if (tag != null)
          stream_medias_by_tag(tag, callback);
      });
    } else {
      var tag = sanitize_tag(tags);
      stream_medias_by_tag(tag, callback);
    }
  };

  // This is where you would initially send users to authorize
  router.get('/api/instagram/authorize_user', this.authorize_user);
  // This is your redirect URI
  router.get('/api/instagram/auth', this.handle_auth);
};

module.exports = InstagramClient;
