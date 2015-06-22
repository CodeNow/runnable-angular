'use strict';

var util = require('./util');
/**
 * Tests a user's ability to log into the site
 */
describe('login', function() {
  it('should allow the user to login via GitHub', function() {
    // Using browser.driver to skip over Protractor because GH doesn't use Angular
    browser.driver.get(browser.baseUrl + '?password=e2e');

    browser.driver.findElement(by.css('header a[href]')).click();

    util.waitForUrl(/github/);

    // We're at GitHub
    var emailInput = browser.driver.findElement(by.id('login_field'));
    emailInput.sendKeys(browser.params.user);

    var passwordInput = browser.driver.findElement(by.id('password'));
    passwordInput.sendKeys(browser.params.password);

    var signInButton = browser.driver.findElement(by.css('input[name="commit"]'));
    signInButton.click();

    // We're being redirected
    util.waitForUrl(/runnable-doobie/);
  });
});