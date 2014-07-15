var $ = require('jquery');
require('app')
  .directive('togglePopOver', togglePopOver);
/**
 * togglePopOver Directive
 * @ngInject
 */
function togglePopOver(
) {
  return {
    restrict: 'A',
    scope: {
      model: '=togglePopOverModel'
    },
    link: function ($scope, element, attrs) {
      var clickHandler = $.proxy(function (event) {
        if(this.model && event.currentTarget === event.target) {
          return; // let propagate
        } else if(!this.model && event.currentTarget === event.target) {
          event.stopPropagation();
          this.model = true;
          this.$apply();
        } else if(this.model && event.currentTarget !== event.target) {
          event.stopPropagation();
        }
      }, $scope);
      element.on('click', clickHandler);
      element.on('$destroy', function () {
        element.off('click');
      });
      $scope.$on('app-document-click', function () {
        $scope.model = false;
      });
    }
  };
}
