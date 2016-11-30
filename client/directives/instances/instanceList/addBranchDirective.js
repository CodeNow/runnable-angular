'use strict';

require('app')
  .directive('addBranch', addBranch);
/**
 * @ngInject
 */
function addBranch() {
  return {
    restrict: 'A',
    templateUrl: 'addBranchView',
    scope: {
      userName: '=?',
      instanceName: '=?',
    },
    link: function ($scope, element, attrs) {
      console.log('scope -', $scope.userName, $scope.instanceName);

      $scope.getBranchCloneCopyText = function () {
        return 'git clone https://github.com/' + $scope.userName + '/' + $scope.instanceName + '.git; cd node-starter; git checkout -b my-branch; git push origin my-branch;';
      };
    }
  };
}
