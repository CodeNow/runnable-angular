require('app')
  .controller('ControllerDemoLayout', demoLayout);

function demoLayout (
  $scope,
  $timeout,
  $window
) {
  $scope.data = {
    page: 1
  };
  $scope.actions = {
    nextPage: function () {
      console.log($scope.data.page);
      $scope.data.page += 1;
    },
    previousPage: function () {
      console.log($scope.data.page);
      $scope.data.page--;
    }
  };

  $scope.actions.actionsModalSignIn = {
    nextPage: $scope.actions.nextPage
  };

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
  });
}