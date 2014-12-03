require('app')
  .controller('ControllerDemoLayout', demoLayout);

function demoLayout (
  editorCache,
  $rootScope,
  $scope,
  $state,
  $timeout,
  $window
) {
  var dataDemoLayout = $scope.dataDemoLayout = {
    data: {},
    actions: {}
  };
  var data = dataDemoLayout.data;
  var actions = dataDemoLayout.actions;

  // May not be the best system
  if ($state.current.name === 'demo.anon') {
    data.page = 1;
  } else {
    data.page = 2;
  }

  actions.nextPage = function () {
    data.page++;
  };
  actions.previousPage = function () {
    data.page--;
  };

  actions.actionsModalSignIn = {
    nextPage: actions.nextPage
  };

  // Hacky stuff, fix once we've got a solid idea of what's going in here
  $scope.$watch('dataDemoLayout.data.page', function(n) {
    // Pages are 1-indexed, no need to worry about zero
    if (!n) { return; }
    if (n === 2) {
      // Grab the isolate scope
      var el = $window.document.querySelector('main > section.sidebar.box-sidebar.ng-scope > section > h2');
      var elScope = angular.element(el).scope();
      // Set it to false initially to ensure the change is triggered
      // Otherwise the watch in dirAddRepoPopover won't run
      elScope.data.show = false;
      $rootScope.safeApply(function() {
        elScope.data.show = true;
      });
    }
    if (n === 3) {
      // Set the active line to the one with ADD
      editorCache.Dockerfile.find('ADD');
    }
  });
}