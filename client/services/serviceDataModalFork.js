/**
 * Fork modal shared data.
 * Fork modal present on instance
 * and instanceEdit
 */
require('app')
  .factory('dataModalFork', function () {
    return dataModalFork;
  });

/**
 * @ngInject
 */
function dataModalFork ($scope) {
  var data = $scope.data = {};
  var actions = $scope.actions = {};
}
