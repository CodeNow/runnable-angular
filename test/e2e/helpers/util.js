var util = {};

util.processUrl = function (middle) {
  return 'http://localhost:3001' + middle + '/';
};

util.waitForUrl = function (url) {
  return browser.wait(function () {
    return browser.getCurrentUrl().then(function (currentUrl) {
      if (typeof url === 'object') {
        // It's a regex
        return url.test(currentUrl);
      }
      return currentUrl === url;
    });
  });
};

module.exports = util;