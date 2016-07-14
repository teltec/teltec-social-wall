var request = require('request');
var util = require('util');

var InstagramFacade = function (router, insta_config) {
  var self = this;
  var ig = require('instagram-node').instagram();

  var CLIENT_ID = insta_config.client_id;
  var CLIENT_SECRET = insta_config.client_secret;
  var ACCESS_TOKEN = insta_config.access_token;
  var REDIRECT_URI = insta_config.redirect_uri;

  ig.use({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    access_token: ACCESS_TOKEN
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
  
  var _cache_tag_media_recent = {};

  this.tag_media_recent = function (tag_name, callback) {
    var skip_duplicates = true;
    var cache = _cache_tag_media_recent;
    var response_handler = function (err, medias, pagination, remaining, limit) {
      if (err) {
        console.error(err);
      } else {
        medias.forEach(function (media) {
          //console.log(media);
          var media_id = media['id'];
          //console.log("Received: " + media_id);
          // Skipped medias that are already in cache.
          if (skip_duplicates && cache.hasOwnProperty(media_id))
            return;
          cache[media_id] = true;

          var url = util.format('https://api.instagram.com/oembed/?url=%s?OMITSCRIPT=true', media.link); 
          request(url, function (err, res, body) {
            if (typeof callback === 'function')
              media['oembed'] = JSON.parse(body);
              callback(media);
          });
        });
        
        var ONE_HOUR = 3600; // In seconds
        var run_after_millis = Math.ceil(ONE_HOUR / limit) * 1000;

        if (pagination.next) {
          pagination.next(response_handler); // Fetch next page results.
        } else {
          // Re-schedule!
          setTimeout(function () { self.tag_media_recent(tag_name, callback); }, run_after_millis);
        }
      }
    };
    var result = ig.tag_media_recent(tag_name, {}, response_handler);
    return result;
  }

  // This is where you would initially send users to authorize
  router.get('/api/instagram/authorize_user', this.authorize_user);
  // This is your redirect URI
  router.get('/api/instagram/auth', this.handle_auth);
};

module.exports = InstagramFacade;
