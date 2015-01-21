'use strict';

var util = require('./util');

var SetupPage = require('../pages/SetupPage');

/**
 * Tests a user's ability to log into the site
 */
describe('login', function() {
  it('should allow the user to login via GitHub', function() {
    // Using browser.driver to skip over Protractor because GH doesn't use Angular
    browser.driver.get(browser.baseUrl + '?password=e2e');

    browser.driver.findElement(by.css('#wrapper > header > nav > a.btn.btn-hero.ng-scope')).click();

    // We're at GitHub
    var emailInput = browser.driver.findElement(by.id('login_field'));
    emailInput.sendKeys('runnable-doobie');

    var passwordInput = browser.driver.findElement(by.id('password'));
    passwordInput.sendKeys('purple4lyfe');

    var signInButton = browser.driver.findElement(by.css('input[name="commit"]'));
    signInButton.click();

    // We're being redirected
    util.waitForUrl(SetupPage.urlRegex);

    expect(browser.getTitle()).toBe('Runnable');
  });
});
