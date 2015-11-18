'use strict';

require('app')
  .controller('InviteAdminModalController', InviteAdminModalController);

function InviteAdminModalController(
  $state,
  $timeout,
  errs,
  fetchGitHubAdminsByRepo,
  close,
  instance,
  isFromAutoDeploy
) {
  var IAMC = this;
  IAMC.close = close;
  IAMC.isFromAutoDeploy = isFromAutoDeploy || false;
  IAMC.DEFAULT_MESSAGE = 'Join my Sandbox on Runnable, where we can run the code in CodeNow\'s repositories on demand.\n\nI need your admin permissions to enable some features. Thanks!';

  IAMC.repoName = instance.getRepoName();
  var username = $state.params.userName;
  fetchGitHubAdminsByRepo(username, IAMC.repoName)
    .then(function (admins) {
      IAMC.admins = admins;
    })
    .catch(function (err) {
      errs.handler(err);
      close();
    });

  IAMC.sendEmail = function (user) {
    IAMC.sending = true;
    $timeout(angular.noop, 1000)
      .then(function () {
        IAMC.sending = false;
        IAMC.activeItem = null;
        user.emailSent = true;
      });
  };

  IAMC.selectUser = function (user) {
    user.emailMessage = IAMC.DEFAULT_MESSAGE;
    IAMC.activeItem = user.login;
  };
}
