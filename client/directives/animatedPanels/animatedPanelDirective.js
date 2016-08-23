'use strict';

require('app')
  .directive('animatedPanel', animatedPanel);

function animatedPanel() {
  return {
    restrict: 'E',
    scope: true,
    transclude: true,
    template: '<div class="animated-panel js-animate" ng-class="getPanelClass(name)"></div>',
    replace: true,
    link: function ($scope, element, attrs, controller, transcludeFn) {
      $scope.name = attrs.name;
      $scope.registerPanel(attrs.name, element, attrs.default === 'true');

      $scope.isActivePanel = function () {
        return $scope.activePanel === $scope.name;
      };

      transcludeFn($scope, function(clone){
        element.append(clone);
      });
    }
  };
}
