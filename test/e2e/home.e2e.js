var chai = require('chai');
var expect = chai.expect;
describe('home', function () {
  it('should allow navigation to /', function () {
    //browser.get('/');
    //element(by.css('div.content-wrapper a.btn')).click();
    browser.driver.get('http://localhost:3030/auth/github?redirect=http://localhost:3001');

    //login
    browser.driver.findElement(by.css('input[name="login"]'))
      .sendKeys('cflynn.us@gmail.com');
    browser.driver.findElement(by.id('password'))
      .sendKeys(process.env.PASSWORD);
    browser.driver.findElement(by.css('input[name="commit"][type="submit"]'))
      .click();

    browser.driver.getCurrentUrl()
      .then(function (currentUrl) {
        expect(currentUrl).to.contain('http://localhost:3001');
      });

    browser.driver.sleep(4000);

  });
});
