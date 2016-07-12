'use strict';

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