require('app')
  .directive('fileTree', fileTreeFactory);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTreeFactory (
  $timeout,
  user,
  holdUntilAuth,
  async
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      'userName':    '=',
      'projectName': '=',
      'branchName':  '=',
      'buildId':     '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      // file can be dir or file
      actions.clickFile = function (file) {
        console.log(file);
      };

      async.waterfall([
        holdUntilAuth,
        function fetchProject (thisUser, cb) {
          function updateDom () {
            if (!projects.models.length) {
              return;
            }
            data.project = projects.models[0];
            cb();
            cb = angular.noop;
            $timeout(function () {
              $scope.$apply();
            });
          }

          var projects = thisUser.fetchProjects({
            ownerUsername: $scope.userName,
            name:          $scope.projectName
          }, function (err, body) {
            if (err) {
              return cb(err); // error handling
            }
            updateDom();
          });
          updateDom();
        },
        function fetchEnvironment (cb) {
          var project = data.project;

          function updateDom () {
            if (!environments.models.length) {
              return;
            }
            data.environment = environments.models[0];
            cb();
            cb = angular.noop;
            $timeout(function () {
              $scope.$apply();
            });
          }

          var environments = project.fetchEnvironments({
            ownerUsername: $scope.userName,
            name:          $scope.branchName
          }, function (err, results) {
            if (err) {
              return cb(err);
            }
            updateDom();
          });
          updateDom();
        },
        function fetchBuild (cb) {
          var environment = data.environment;
          function updateDom () {
            if (!build.attrs.created) {
              return;
            }
            data.build = build;
            cb();
            cb = angular.noop;
            $timeout(function () {
              $scope.$apply();
            });
          }

          var build = environment.fetchBuild($scope.buildId, function (err, body) {
            if (err) {
              return cb(err);
            }
            updateDom();
          });
          updateDom();

        },
        function fetchVersion (cb) {
          var build = data.build;
          var contextId = build.toJSON().contexts[0];
          var versionId = build.toJSON().versions[0];

          var version = user
          .newContext(contextId)
          .fetchVersion(versionId, function (err) {
            if (err) {
              return cb(err);
            }
            data.version = version;
            cb();
          });
        },
        function fetchFiles (cb) {
          var version = data.version;
          var buildFiles = version.fetchFiles(function (err) {
            if (err) {
              return cb(err);
            }
            data.buildFiles = buildFiles;
            cb();
          });
        }
      ], function (err) {
        $timeout(function () {
          $scope.$apply();
        });
      });

    }
  };
}
