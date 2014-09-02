var chai = require('chai');
var expect = chai.expect;

describe('home state', function () {

  it('should not redirect authenticated users', function () {
    browser.get('/');
    // assert presence of login button
  });

  it('should have a login button', function () {
  });

  it('should redirect authenticated users with 0 projects to new', function () {
  });

  it('should redirect authenticated users with >= 1 projects to buildList', function () {
  });

    /**
     * authenticated users with >= 1 project
     * should redirect to buildList
     *
     * 0 projects redirect /new
     */
/*
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
*/


//  it('should allow user to oauth with GitHub', function () {
//    browser.driver.get('http://localhost:3030/auth/github?redirect=http://localhost:3001');
//  });
});
