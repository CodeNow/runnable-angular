'use strict';

var util = {};

util.processUrl = function (middle) {
  return browser.baseUrl + middle + '/';
};

util.waitForUrl = function (url) {
  return browser.wait(function () {
    return browser.driver.getCurrentUrl().then(function (currentUrl) {
      if (typeof url === 'object' && typeof url.test === 'function') {
        // It's a regex
        return url.test(currentUrl);
      }
      return currentUrl === url;
    });
  });
};

util.containsText = function (elem, expected) {
  return elem.get().getText().then(function (elemText) {
    if (typeof expected === 'object' && typeof expected.test === 'function') {
      // It's a regex
      return expected.test(elemText);
    }
    return elemText === expected;
  });
};

util.createGetter = function (by) {
  return {
    get: function () {
      return element(by);
    }
  };
};

util.createGetterAll = function(by) {
  return {
    get: function (idx) {
      if (idx !== undefined) {
        return element(by.row(idx));
      } else {
        return element.all(by);
      }
    }
  };
};

util.hasClass = function(elem, klass) {
  return elem.get().getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf(klass) > -1;
  });
};

util.getOSCommandKey = function() {
  if (browser.inOSX()) {
    return protractor.Key.COMMAND;
  } else {
    return protractor.Key.CONTROL;
  }
};

util.regex = {};

// Regexes are strings here because they will be concatenated later
// var reg = RegExp('/SomeKittens/' + util.regex.shortHash);
util.regex.shortHash = '[a-z0-9]{6}';
util.regex.instanceName = '[A-z0-9_-]+';
util.regex.objectId = '[0-9a-fA-F]{24}';

module.exports = util;
