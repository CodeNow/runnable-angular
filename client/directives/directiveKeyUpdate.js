require('app')
  .directive('keyUpdate', keyUpdate);
/**
 * keyUpdate Directive
 * $ngInject
 */
function keyUpdate(
  $compile
) {
  return {
    restrict: 'A',
    scope: {
      fooModel: '=keyUpdateSomeProp',
      attr: '@attr'
    },
    link: function ($scope, element, attrs) {
      window.fs = $scope;
      /*  if(!element.attr('ng-model')){
        // element.attr('ng-model', 'dataBuildList.data.project.attrs.name');
        element.attr('ng-model', 'attrModel.attr.'+$scope.attr);
        $compile(element)($scope);
      }
    */
    }
  };
}
