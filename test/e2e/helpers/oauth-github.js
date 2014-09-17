function login () {
    browser.driver.get('http://localhost:3001');

    browser.driver.findElement(by.css('#wrapper > main > a.btn')).click();

    // at this point my server redirects to google's auth page, so let's log in
    var emailInput = browser.driver.findElement(by.id('login_field'));
    emailInput.sendKeys('runnable-doobie');

    var passwordInput = browser.driver.findElement(by.id('password'));
    passwordInput.sendKeys('purple4lyfe');

    var signInButton = browser.driver.findElement(by.css('input[name="commit"]'));
    signInButton.click();

    // we're about to authorize some permissions, but the button isn't enabled for a second
    browser.driver.sleep(1500);

    expect(browser.getTitle()).toBe('sandbox.runnable');
}

module.exports = login;