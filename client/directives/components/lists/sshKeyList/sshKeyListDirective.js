'use strict';

require('app')
  .directive('sshKeyList', sshKeyList);

function sshKeyList() {
  return {
    restrict: 'A',
    templateUrl: 'sshKeyListView',
    controller: 'SshKeyListController',
    controllerAs: 'SKLC',
    bindToController: true
  };
}
