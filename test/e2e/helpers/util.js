var util = {};

util.processUrl = function (middle) {
  return 'http://localhost:3001' + middle + '/';
};

util.waitForUrl = function (url) {
  return browser.wait(function () {
    return browser.getCurrentUrl().then(function (currentUrl) {
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

util.hasClass = function(elem, klass) {
  return elem.get().getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf(klass) > -1;
  });
};

util.regex = {};

util.regex.shortHash = '[a-z0-9]{6}';
util.regex.instanceName = '[A-z0-9_-]+';
util.regex.objectId = '[0-9a-fA-F]{24}';

module.exports = util;