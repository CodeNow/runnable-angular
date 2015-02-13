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
    get: function (parentElement) {
      var pE = null;
      if (parentElement) {
        pE = (typeof parentElement.get === 'function') ? parentElement.get() : parentElement;
      }
      if (pE) {
        return pE.element(by);
      } else {
        return element(by);
      }
    }
  };
};

util.createGetterAll = function(by, parentElement) {
  return {
    get: function (idx) {
      var pE = null;
      if (parentElement) {
        pE = (typeof parentElement.get === 'function') ? parentElement.get() : parentElement;
      }
      if (pE) {
        if (idx !== undefined) {
          return pE.element(by.row(idx));
        } else {
          return pE.element(by);
        }
      } else {
        if (idx !== undefined) {
          return element.all(by).get(idx);
        } else {
          return element.all(by);
        }
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

// Used in interactive sessions to re-require everything
util.refreshCache = function() {
  var toRefresh = Object.keys(require.cache).filter(function(key) {
    return key.indexOf('protractor') === -1;
  });
  toRefresh.forEach(function(key) {
    delete require.cache[key];
    require(key);
  });
};

util.regex = {};

// Regexes are strings here because they will be concatenated later
// var reg = RegExp('/SomeKittens/' + util.regex.shortHash);
util.regex.shortHash = '[a-z0-9]{6}';
util.regex.instanceName = '[A-z0-9_-]+';
util.regex.objectId = '[0-9a-fA-F]{24}';

module.exports = util;
