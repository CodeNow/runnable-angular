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

util.createGetter = function (by) {
  return {
    get: function () {
      return element(by);
    }
  };
};

util.regex = {};

util.regex.shortHash = '[a-z0-9]{6}';
util.regex.objectId = '[0-9a-fA-F]{24}';

module.exports = util;