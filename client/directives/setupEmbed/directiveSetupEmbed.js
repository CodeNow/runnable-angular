require('app')
  .directive('runnableSetupEmbed', RunnableSetupEmbed);
/**
 * @ngInject
 */
function RunnableSetupEmbed(
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupEmbed',
    replace: true,
    scope: {},
    link: function($scope, elem, attrs) {

    }
  };
}
