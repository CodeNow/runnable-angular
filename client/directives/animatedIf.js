var app = require('app');
app.directive('animatedIf', function($animate) {
  return {
    transclude: 'element',
    priority: 600,
    terminal: true,
    restrict: 'A',
    $$tlb: true,
    scope: {
      'animatedIf': '=',
      'animatedIfEnterCallback': '&',
      'animatedIfLeaveCallback': '&'
    },
    link: function ($scope, $element, $attr, ctrl, $transclude) {
      var block, childScope;
      $scope.$watch('animatedIf', function ngIfWatchAction(value, oldValue) {
        if (value) {
          if (!childScope) {
            //childScope = $scope.$new();
            childScope = $scope.$parent.$new();
            $transclude(childScope, function (clone) {
              clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
              block = {
                clone: clone
              };
              var callback = !oldValue && $scope.animatedIfEnterCallback ? $scope.animatedIfEnterCallback : (function() {});
              $animate.enter(clone, $element.parent(), $element, callback);
            });
          }
        } else {
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          if (block) {
            $animate.leave(block.clone, ($scope.animatedIfLeaveCallback || (function() {})));
            block = null;
          }
        }
      });
    }
  };
});