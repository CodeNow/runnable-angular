'use strict';

var util = require('../helpers/util');
var AccountsSelect = require('../popovers/AccountsSelect');
module.exports = {
  users: ['runnable-doobie', 'runnable-test'],
  changeUser: function (username, manuallySwitch) {
    util.setCurrentUser(username);
    if (manuallySwitch) {
      return browser.get('/' + username);
    } else {
      var accountsSelect = new AccountsSelect();
      accountsSelect.changeUser(username);

      return util.waitForUrl(new RegExp(username));
    }
  },
  doMultipleUsers: function (func, manuallySwitch) {
    var self = this;
    return function (done) {
      self.users.forEach(function (username) {
        describe('Switching User to ' + username, function () {
          it('switches', function () {
            if (util.getCurrentUser() !== username) {
              return self.changeUser(username, manuallySwitch);
            }
          });

          func(username, done);
        });
      });
    };
  }
};
