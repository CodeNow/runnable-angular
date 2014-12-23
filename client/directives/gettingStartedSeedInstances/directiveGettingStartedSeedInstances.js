require('app')
  .directive('gettingStartedSeedInstances', gettingStartedSeedInstances);
/**
 * @ngInject
 */
function gettingStartedSeedInstances (
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewGettingStartedSeedInstances',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      $scope.helloRunnableInstances = [{
        name: 'Django',
        description: 'Launch a web app running on AngularJS and Django',
        icon: 'icons-django',
        shortHash: 'e33x8e'
      }, {
        name: 'Ruby on Rails',
        description: 'Launch a Rails app with MySQL',
        icon: 'icons-ruby-on-rails',
        shortHash: 'eqq8de'
      }, {
        name: 'node.js',
        description: 'I don\'t even know right now',
        icon: 'icons-node.js',
        shortHash: 'ewzkne'
      }];

    }
  };
}
