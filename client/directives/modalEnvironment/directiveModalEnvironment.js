require('app')
  .directive('modalEnvironment', modalEnvironment);
/**
 * directive modalEnvironment
 * @ngInject
 */
function modalEnvironment(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalEnvironment',
    replace: true,
    scope: {
      currentModel: '=modalCurrentModel',
      stateModel: '=modalStateModel'
    },
    link: function ($scope, element, attrs) {
    }
  };
}