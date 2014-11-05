/**
 * Layout stuffs
 */

var util = require('../helpers/util');

var sidebar = {
  boxes: util.createGetter(by.repeater('instance in dataInstanceLayout.data.instances.models | orderBy:\'attrs.name\'')),

  numBoxes: function () {
    return element.all(by.repeater('instance in dataInstanceLayout.data.instances.models | orderBy:\'attrs.name\'')).then(function(elements) {
      return elements.length;
    });
  },

  getBoxNames: function () {
    return element.all(by.repeater('instance in dataInstanceLayout.data.instances.models | orderBy:\'attrs.name\'')).then(function(elements) {
      return elements.map(function(box) {
        return box.name;
      });
    });
  }
}

module.exports = sidebar;