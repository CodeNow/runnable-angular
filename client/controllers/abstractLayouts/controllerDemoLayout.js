require('app')
  .controller('ControllerDemoLayout', demoLayout);

function demoLayout (
  editorCache,
  $scope,
  $timeout,
  $window
) {
  $scope.data = {
    page: 1
  };
  $scope.actions = {
    nextPage: function () {
      $scope.data.page++;
    },
    previousPage: function () {
      $scope.data.page--;
    }
  };

  $scope.actions.actionsModalSignIn = {
    nextPage: $scope.actions.nextPage
  };

  // Hacky stuff, fix once we've got a solid idea of what's going in here
  $scope.$watch('data.page', function(n) {
    // Pages are 1-indexed, no need to worry about zero
    if (!n) { return; }
    if (n === 2) {
      // Triggering a click here because the directive's isolate scope
      // prevents us from modifying that
      var el = $window.document.querySelector('main > section.sidebar.box-sidebar.ng-scope > section > h2 > a');
      var $el = angular.element(el);
      $timeout(function() {
        $el.triggerHandler('click');
      });
    }
    if (n === 3) {
      // Set the active line to the one with ADD
      var result = editorCache.Dockerfile.find('ADD').start.row;
    }
  });
}