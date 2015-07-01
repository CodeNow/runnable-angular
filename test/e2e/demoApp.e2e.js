'use strict';

var util = require('./helpers/util');
var ServerCard = require('./components/serverCard');

describe('demo app test', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {
    util.goToUrl('/' + browser.params.user + '/configure');
    new ServerCard('web').waitForStatusEquals('running');
    new ServerCard('api').waitForStatusEquals('running');
    util.goToUrl('/' + browser.params.user + '/web');
    element(by.css('a.container-url-link[title="Open Container URL"]'))
      .getAttribute('href')
      .then(function (containerUrl) {
        browser.driver.get(containerUrl);
      });
  });
  it('should allow the user to create a new todo', function () {
    var todoMessage = 'Test todo ' + Math.random();
    element(by.css('input[placeholder="Enter a Todo"]')).sendKeys(todoMessage, protractor.Key.ENTER);
    expect(element.all(by.cssContainingText('span', todoMessage)).count()).toEqual(1);
  });
});
