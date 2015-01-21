'use strict';

require('app')
  .directive('instanceEditPrimaryActions', instanceEditPrimaryActions);
/**
 * @ngInject
 */
function instanceEditPrimaryActions(
  async,
  QueryAssist,
  $rootScope,
  $state,
  errs,
  $stateParams
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditPrimaryActions',
    scope: {
      user: '=',
      instance: '=',
      loading: '=',
      openItems: '=',
      unsavedAcvs: '='
    },
    link: function ($scope, elem, attrs) {
      // prevent multiple clicks
      var building = false;
      $scope.build = function (noCache) {
        if (building) { return; }
        building = true;
        $scope.loading = true;
        var unwatch = $scope.$watch('openItems.isClean()', function (n) {
          if (!n) { return; }
          unwatch();
          var buildObj = {
            message: 'Manual build',
            noCache: noCache
          };
          async.series([
            fetchNewBuild,
            function (cb) {
              if (!noCache) {
                return cb();
              }
              var cv = $scope.newBuild.contextVersions.models[0];
              var file = cv.rootDir.contents.find(function(file) {
                return (file.attrs.name === 'Dockerfile');
              });
              file.update({
                json: {
                  body: file.attrs.body
                }
              }, cb);
            },
            updateAppCodeVersions,
            function () {
              var build = $scope.newBuild;
              // Catch the update file error
              $scope.newBuild.build(
                buildObj,
                function (err) {
                  if (err) {
                    return handleError(err);
                  }
                  var opts = {
                    build: build.id()
                  };
                  if ($scope.instance.state && $scope.instance.state.env) {
                    opts.env = $scope.instance.state.env;
                  }
                  $scope.instance.update(opts, function (err) {
                    if (err) {
                      return handleError(err);
                    }
                    // will trigger display of completed message if build completes
                    // before reaching next state
                    // $scope.dataInstanceLayout.data.showBuildCompleted = true;
                    $state.go('instance.instance', $stateParams);
                  });
                });
            }
          ], handleError);
        });
      };

      $scope.popoverBuildOptions = {
        data: {},
        actions: {
          noCacheBuild: function () {
            $scope.popoverBuildOptions.data.show = false;
            $scope.build(true);
          }
        }
      };

      function fetchNewBuild(cb) {
        if (!$scope.user) {
          throw new Error('InstanceEditPrimaryActions can\'t find a user on the scope');
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.newBuild = build;
            cb();
          })
          .resolve(handleError)
          .go();
      }

      function updateAppCodeVersions(cb) {
        var modifiedAcvs = $scope.unsavedAcvs.filter(function (obj) {
            return obj.unsavedAcv.attrs.commit !== obj.acv.attrs.commit;
          });
        if (!modifiedAcvs.length) {
          return cb();
        }

        var context = $scope.newBuild.contexts.models[0];
        var contextVersion = $scope.newBuild.contextVersions.models[0];
        var infraCodeVersionId = contextVersion.attrs.infraCodeVersion;

        var appCodeVersionStates = $scope.unsavedAcvs.map(function (obj) {
          var acv = obj.unsavedAcv;
          return {
            repo: acv.attrs.repo,
            branch: acv.attrs.branch,
            commit: acv.attrs.commit
          };
        });
        async.waterfall([
          createContextVersion,
          createBuild
        ], cb);

        function createContextVersion(cb) {
          var body = {
            infraCodeVersion: infraCodeVersionId
          };
          var newContextVersion = context.createVersion(body, function (err) {
            async.each(appCodeVersionStates, function (acvState, cb) {
              newContextVersion.appCodeVersions.create(acvState, cb);
            }, function (err) {
              cb(err, newContextVersion);
            });
          });
        }
        function createBuild(contextVersion, cb) {
          var build = $scope.user.createBuild({
            contextVersions: [contextVersion.id()],
            owner: $scope.instance.attrs.owner
          }, function (err) {
            $scope.newBuild = build;
            cb(err, build);
          });
        }
      }
      function handleError(err) {
        if (err) {
          $scope.loading = false;
          errs.handler(err);
        }
      }
    }
  };
}
