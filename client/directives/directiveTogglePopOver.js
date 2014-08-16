var $ = require('jquery');
require('app')
  .directive('togglePopOver', togglePopOver);
/**
 * togglePopOver Directive
 * @ngInject
 */
function togglePopOver(
  $rootScope
) {
  return {
    restrict: 'A',
    scope: {
      model: '=togglePopOverModel'
    },
    link: function ($scope, element, attrs) {
      var clickHandler = $.proxy(function (event) {
        if (!this.model && !element.prop('disabled')) {
          event.stopPropagation();
          $rootScope.$broadcast('app-document-click');
          this.model = true;
          this.$apply();
        }
      }, $scope);
      element.on('click', clickHandler);
      $scope.$on('$destroy', function () {
        element.off('click');
      });
      $scope.$on('app-document-click', function () {
        $scope.model = false;
      });
    }
  };
}
