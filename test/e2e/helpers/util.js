'use strict';

var util = {};
var user = 'runnable-doobie';
util.getCurrentUser = function () {
  return user;
};
util.setCurrentUser = function (_user) {
  user = _user;
};

util.processUrl = function (middle) {
  return browser.baseUrl + middle + '/';
};

util.waitForUrl = function (url, duration) {
  duration = duration || 1000 * 5;
  return browser.wait(function () {
    return browser.driver.getCurrentUrl().then(function (currentUrl) {
      if (typeof url === 'object' && typeof url.test === 'function') {
        // It's a regex
        return url.test(currentUrl);
      }
      return currentUrl === url;
    });
  }, duration);
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


util.createGetter = function (by, parentElement) {
  return {
    get: function (overridePe) {
      var pE = null;
      if (overridePe) {
        parentElement = overridePe;
      }
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

util.testTimeout = function (timeout) {
  var originalTimeout = 1000 * 10;
  beforeEach(function () {
    jasmine.getEnv().defaultTimeoutInterval  = timeout;
  });
  afterEach(function () {
    jasmine.getEnv().defaultTimeoutInterval = originalTimeout;
  });
}

util.createGetterAll = function(by, parentElement) {
  return {
    get: function (idx) {
      var pE = null;
      if (parentElement) {
        pE = (typeof parentElement.get === 'function') ? parentElement.get() : parentElement;
      }
      if (pE) {
        if (idx !== undefined) {
          return pE.all(by).get(idx);
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
  if (typeof elem.get === 'function') {
    elem = elem.get();
  }
  return elem.getAttribute('class').then(function (classes) {
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
    // Only refresh our stuff
    return key.indexOf('test/e2e') > -1;
  });
  toRefresh.forEach(function(key) {
    delete require.cache[key];
    require(key);
  });
};

var counts = {};
util.goToUrl = function (url) {
  var newUrl = browser.baseUrl + url;
  return browser.driver.getCurrentUrl().then(function (oldUrl) {
    if (newUrl.slice(-1) !== '/') {
      newUrl = newUrl + '/';
    }
    if (oldUrl !== newUrl) {
      browser.driver.get(newUrl);
      return util.goToUrl(url);
    }

    counts[url] = counts[url] || 0;
    counts[url] += 1;
    if (counts[url] > 20) {
      return;
    }
    return element.all(by.css('.modal-error .modal-description'))
      .count()
      .then(function (errorCount) {
        if (errorCount > 0) {
          browser.driver.get(newUrl);
          return util.goToUrl(url);
        }
      });
  });
};

util.regex = {};

// Regexes are strings here because they will be concatenated later
// var reg = RegExp('/SomeKittens/' + util.regex.shortHash);
util.regex.shortHash = '[a-z0-9]{6}';
util.regex.instanceName = '[A-z0-9_-]+';
util.regex.objectId = '[0-9a-fA-F]{24}';

module.exports = util;
