require('app')
  .directive('dockerTemplates', dockerTemplates);
/**
 * @ngInject
 */
function dockerTemplates(
  async,
  determineActiveAccount,
  keypather,
  QueryAssist,
  fetchUser,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewDockerTemplates',
    replace: true,
    scope: {
      openItems: '=',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      /**
       * Fetch dockerfile(s) for seed context
       */
      $scope.selectedSourceContext = null;
      $scope.valid = false;
      $scope.selectSourceContext = function (context) {
        $scope.valid = false;
        $scope.openItems.reset([]);
        $scope.selectedSourceContext = context;

        function fetchContextVersion(cb) {
          var context = $scope.selectedSourceContext;
          new QueryAssist(context, cb)
            .wrapFunc('fetchVersions')
            .cacheFetch(function (versions, cached, cb) {
              $scope.versions = versions;
              $rootScope.safeApply();
              cb();
            })
            .resolve(function (err, versions, cb) {
              if (err) { throw err; }
              $rootScope.safeApply();
              cb(err);
            })
            .go();
        }

        function copyFilesFromSource(cb) {
          var sourceInfraCodeVersion = $scope.versions.models[0].attrs.infraCodeVersion;
          var contextVersion = $scope.build.contextVersions.models[0];
          var sourceContextVersion = $scope.versions.models[0];
          contextVersion.copyFilesFromSource(sourceInfraCodeVersion, function (err) {
            if (err) { throw err; }
            contextVersion.source = sourceContextVersion.id();
            cb();
          });
        }

        function fetchContextVersionFiles(cb) {
          var contextVersion = $scope.build.contextVersions.models[0];
          new QueryAssist(contextVersion, cb)
            .wrapFunc('fetchFsList')
            .query({
              path: '/'
            })
            .cacheFetch(function updateDom(files, cached, cb) {
              if (cached) { return; } // cached response contains old files
              $scope.openItems.add(files.models);
              $rootScope.safeApply();
              cb();
            })
            .resolve(function (err, files, cb) {
              if (err) { throw err; }
              $scope.openItems.add(files.models);
              $rootScope.safeApply();
              cb();
            })
            .go();
        }

        function setDockerFileValid(cb) {
          $scope.valid = true;
          cb();
        }

        async.series([
          fetchContextVersion,
          copyFilesFromSource,
          fetchContextVersionFiles,
          setDockerFileValid
        ]);
      };

      function fetchBuild(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) { throw err; }
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      function fetchSeedContexts(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchContexts')
          .query({
            isSource: true
          })
          .cacheFetch(function (contexts, cached, cb) {
            $scope.seedContexts = contexts;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, contexts, cb) {
            if (err) { throw err; }
            cb();
          })
          .go();
      }

      async.waterfall([
        determineActiveAccount,
        function (activeAccount, cb) {
          $scope.activeAccount = activeAccount;
          $rootScope.safeApply();
          cb();
        },
        function (cb) {
          fetchUser(function(err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          });
        },
        function (cb) {
          async.parallel([
            fetchBuild,
            fetchSeedContexts
          ], cb);
        }
      ]);

    }
  };
}
