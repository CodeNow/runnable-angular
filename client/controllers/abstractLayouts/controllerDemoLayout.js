'use strict';

require('app')
  .controller('ControllerDemoLayout', controllerDemoLayout);
/**
 * @ngInject
 */
function controllerDemoLayout (
  editorCache,
  fetchUser,
  keypather,
  QueryAssist,
  $rootScope,
  $scope,
  $state,
  $window
) {
  var dataDemoLayout = $scope.dataDemoLayout = {
    data: {},
    actions: {}
  };
  var data = dataDemoLayout.data;
  var actions = dataDemoLayout.actions;

  function helperFetchInstance (cb) {
    fetchUser(function (err, user) {
      if (err) { throw err; }
      new QueryAssist(user, cb)
        .wrapFunc('fetchInstances')
        .query({
          githubUsername: $state.params.userName,
          name: $state.params.instanceName
        })
        .cacheFetch(function (instances, cached, cb) {
          var instance = keypather.get(instances, 'models[0]');
          if (!instance) {
            cb(new Error('Could not find instance on server'));
          } else {
            $scope.safeApply();
            cb(null, instance);
          }
        })
        .resolve(function (err) {
          cb(err);
        })
        .go();
    });
  }

  actions.stateToDemoInstanceEdit = function () {
    helperFetchInstance(function (err, instance) {
      if (err) { throw err; }
      var forkedBuild = instance.build.deepCopy(function (err) {
        if (err) { throw err; }
        $state.go('demo.instanceEdit', {
          userName: $state.params.userName,
          instanceName: $state.params.instanceName,
          buildId: forkedBuild.id()
        });
      });
    });
  };

  data.dockerInstructionPopover = {
    in: false
  };
  data.buildInstructionPopover = {
    in: false
  };

  data.popoverCoachMarks = {};

  /**
   * Set up scope objects for all guide-tips.
   * $watcher will remove guide-tip after display-then-hide
   */
  [
    'boxName',
    'repo',
    'panel',
    'edit'
  ].forEach(function (val) {
    data.popoverCoachMarks[val] = {
      data: {
        show: false,
        hasBeenViewed: false
      }
    };
    (function () {
      var deregisterFunc = $scope.$watch('dataDemoLayout.data.popoverCoachMarks.'+val+'.show',
        function (n, p) {
          if (n === false && p === true) {
            keypather.set($scope, 'dataDemoLayout.data.popoverCoachMarks.'+val+'.hasBeenViewed', true);
            deregisterFunc();
          }
        });
    })();
  });



  var elScope;
  var addLines = [];
  var addPopopShown = false;

  // Repos load before dockerfile, so ADD won't be inserted for prexisting repos
  //  Not within scope of current iteration.  Fix when add/remove ADD becomes universal.
  // FIXME: Lines marked with `X` assume ADD statements should be on the second line.
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
        editorCache.Dockerfile.moveCursorTo(1, 0); // X
        editorCache.Dockerfile.insert('ADD ./' + repoName + ' /' + repoName + '\n');
        addLines.push(newAcv.attrs.repo);
      });
      if (n === 1 && !addPopopShown) {
        addPopopShown = true;
        data.dockerInstructionPopover.in = true; // X
        // var lastAddLine = editorCache.Dockerfile.find('ADD');
      }
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
      if (!el) { return; }
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
      // Show build button popover
      data.dockerInstructionPopover.in = false;
      data.buildInstructionPopover.in = true;
    }
  });
}
