'use strict';

var Shuffle = window.shuffle;

var DynamicGrid = function (element) {
  this.element = element;

  // Log events.
  this.registerEventListeners();

  this.shuffle = new Shuffle(element, {
    itemSelector: '.social-item',
    //sizer: this._get_social_item_size,
  });
};

DynamicGrid.prototype.sortBy = function (value_fn, is_reverse) {
  var sortOptions = {
    by: value_fn, // function that returns the value
    reverse: is_reverse, // true of false
  }
  this.shuffle.sort(sortOptions);
};

// DynamicGrid.prototype._get_social_item_size = function (width) {
//   console.log("DEBUG: _get_social_item_size");
//   return width;
// };

DynamicGrid.prototype.registerEventListeners = function () {
  var layout_handler = function () {
    console.log('Things finished moving!');
  };
  var removed_handler = function (event) {
    console.log('type: %s', event.type, 'detail:', event.detail);
  };

  this.element.addEventListener(Shuffle.EventType.LAYOUT, layout_handler, false);
  this.element.addEventListener(Shuffle.EventType.REMOVED, removed_handler, false);
};

DynamicGrid.prototype.updateLayout = function () {
  this.shuffle.layout();
};

DynamicGrid.prototype.push_back = function ($new_element, on_complete) {
  // new_element.attr('data-groups', '["twitter"]');

  $(this.element).append($new_element); // Insert it
  this.shuffle.add($new_element);
  this.updateLayout();

  if (typeof on_complete === 'function')
    on_complete();
};

DynamicGrid.prototype.pop_front = function (on_complete) {
  var $element = $(this.element).find('div:first');
  this.shuffle.remove($element); // This already removes the element from its parent.
  this.updateLayout()

  if (typeof on_complete === 'function')
    on_complete();
};
