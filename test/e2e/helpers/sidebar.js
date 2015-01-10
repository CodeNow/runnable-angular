'use strict';

/**
 * Layout stuffs
 */

var util = require('../helpers/util');

var sidebar = {
  boxes: util.createGetter(by.repeater('instance in instances.models')),

  numBoxes: function () {
    return element.all(by.repeater('instance in instances.models')).then(function(elements) {
      return elements.length;
    });
  },

  getBoxNames: function () {
    return element.all(by.repeater('instance in instances.models')).map(function(element) {
      return element.getText();
    });
  }
};

module.exports = sidebar;
