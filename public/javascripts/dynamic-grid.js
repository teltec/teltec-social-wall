'use strict';

var Shuffle = window.shuffle;

var DynamicGrid = function (element) {
  this.element = element;

  this.shuffle = new Shuffle(element, {
    itemSelector: '.social-item',
    //sizer: this._get_social_item_size,
  });

  // Log events.
  this.register_event_listeners();
};

DynamicGrid.prototype.sort_by = function (value_fn, is_reverse) {
  var sortOptions = {
    by: value_fn, // function that returns the value
    reverse: is_reverse, // true of false
  }
  this.shuffle.sort(sortOptions);
};

// DynamicGrid.prototype._get_social_item_size = function (width) {
//   console.log('DEBUG: _get_social_item_size');
//   return width;
// };

DynamicGrid.prototype.on_layout = function (callback) {
  this.element.addEventListener(Shuffle.EventType.LAYOUT, callback, false);
}

DynamicGrid.prototype.register_event_listeners = function () {
  var layout_handler = function () {
    console.log('Things finished moving!');
  };
  var removed_handler = function (event) {
    console.log('type: %s', event.type, 'detail:', event.detail);
  };

  this.element.addEventListener(Shuffle.EventType.LAYOUT, layout_handler, false);
  this.element.addEventListener(Shuffle.EventType.REMOVED, removed_handler, false);
};

DynamicGrid.prototype.update_layout = function () {
  this.shuffle.layout();
};

DynamicGrid.prototype.push_back = function ($new_element, on_complete) {
  // new_element.attr('data-groups', '["twitter"]');

  $(this.element).append($new_element); // Insert it
  this.shuffle.add($new_element);
  this.update_layout();

  if (typeof on_complete === 'function')
    on_complete();
};

DynamicGrid.prototype.pop_front = function (on_complete) {
  var $element = $(this.element).find('div:first');
  this.shuffle.remove($element); // This already removes the element from its parent.
  this.update_layout()

  if (typeof on_complete === 'function')
    on_complete();
};
