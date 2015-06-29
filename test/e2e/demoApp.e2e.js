'use strict';

var util = require('./helpers/util');
var ServerCard = require('./components/serverCard');

describe('demo app test', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {

    return util.goToUrl('/' + browser.params.user + '/configure')
      .then(function () {
        var serverCard = new ServerCard('web');
        return serverCard.waitForStatusEquals('running');
      })
      .then(function () {
        var serverCard = new ServerCard('api');
        return serverCard.waitForStatusEquals('running');
      })
      .then(function () {
        util.goToUrl('/' + browser.params.user + '/web');
      })
      .then(function () {
        return element(by.css('a.container-url-link[title="Open Container URL"]')).getAttribute('href');
      })
      .then(function (containerUrl) {
        return browser.driver.get(containerUrl);
      })
      .then(function () {
        return browser.driver.sleep(1000 * 5);
      });
  });
  it('should allow the user to create a new todo', function () {
    var todoMessage = 'Test todo ' + Math.random();
    return element(by.css('input[placeholder="Enter a Todo"]')).sendKeys(todoMessage, protractor.Key.ENTER)
      .then(function () {
        expect(element.all(by.cssContainingText('span', todoMessage)).count()).toEqual(1);
      });
  });
});
