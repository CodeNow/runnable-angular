'use strict';

var util = require('./helpers/util');
var InstancePage = require('./pages/InstancePage');
var AccountsSelect = require('./popovers/AccountsSelect');

describe('change user', function() {
  it('should be able to change to an org', function() {
    util.setCurrentUser('runnable-test');
    //
    //var accountsSelect = new AccountsSelect();
    //accountsSelect.changeUser('runnable-test');

    browser.get('/runnable-test');
  });
});
