require('app')
  .controller('ControllerDemoLayout', demoLayout);

function demoLayout (
  editorCache,
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
  $scope.$watch('data.page', function(n) {
    // Pages are 1-indexed, no need to worry about zero
    if (!n) { return; }
    if (n === 2) {
      // Triggering a click here because the directive's isolate scope
      // prevents us from modifying that
      var el = $window.document.querySelector('main > section.sidebar.box-sidebar.ng-scope > section > h2 > a');
      var $el = angular.element(el);
      // triggerHandler needs to be run on nextTick
      $timeout(function() {
        $el.triggerHandler('click');
      });
      // Grab the parent scope so we can track repo add
      var scp = $el.parent().scope();
      scp.$watch('unsavedAcvs.length', function(n) {
        if (n === 1) {
          actions.nextPage();
        }
      });
    }
    if (n === 3) {
      // Set the active line to the one with ADD
      editorCache.Dockerfile.find('ADD');
    }
  });
}