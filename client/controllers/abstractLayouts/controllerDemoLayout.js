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

  var elScope;
  var addLines = [];

  // Repos load before dockerfile, so ADD won't be inserted for prexisting repos
  //  Not within scope of current iteration.  Fix when add/remove ADD becomes universal.
  function updateADD(n, o) {
    // We want to continue on zero
    if (typeof n === 'undefined') { return; }
    if (!editorCache.Dockerfile) { return; }

    var models = elScope.build.contextVersions.models[0].appCodeVersions.models;
    if (typeof o === 'undefined' || n > o) {
      // Add another ADD line
      // Find the new ones
      var newAcvs = models.filter(function(acv) {
        return !~addLines.indexOf(acv.attrs.repo);
      });
      newAcvs.forEach(function(newAcv) {
        var repoName = newAcv.attrs.repo.split('/')[1];
        editorCache.Dockerfile.moveCursorTo(1, 0);
        editorCache.Dockerfile.insert('ADD ./' + repoName + ' /' + repoName + '\n');
        addLines.push(newAcv.attrs.repo);
      });
    } else {
      // Figure out which one was removed, remove corresponding ADD line
      // Don't even think of trying to compute the Big O here
      // Having said that, the comments on the above line in the PR will all be calculating it.
      // It's O(m * n).  There you go.  Continue with the pedantic arguments about technicalities.
      var removedRepo = addLines.filter(function(repoName) {
        return !models.filter(function (m) {
          return m.attrs.repo === repoName;
        }).length;
      })[0];
      if (!removedRepo) { return; }
      var repoName = removedRepo.split('/')[1];
      editorCache.Dockerfile.find(repoName);
      editorCache.Dockerfile.removeLines();
      addLines.splice(addLines.indexOf(repoName), 1);
    }
  }

  // Hacky stuff, fix once we've got a solid idea of what's going in here
  $scope.$watch('dataDemoLayout.data.page', function(n) {
    // Pages are 1-indexed, no need to worry about zero
    if (!n) { return; }
    if (n === 2) {
      // Grab the isolate scope
      var el = $window.document.querySelector('main > section.sidebar.box-sidebar.ng-scope > section > h2');
      elScope = angular.element(el).scope();

      // Update the Dockerfile on repo add/remove
      elScope.$watch('build.contextVersions.models[0].appCodeVersions.models.length', updateADD);

      // Set it to false initially to ensure the change is triggered
      // Otherwise the watch in dirAddRepoPopover won't run
      elScope.data.show = false;
      $rootScope.safeApply(function() {
        elScope.data.show = true;
      });
    }
    if (n === 3) {
      // Set the active line to the one with ADD
      // findAll may be more appropriate
      editorCache.Dockerfile.find('ADD');
    }
  });
}