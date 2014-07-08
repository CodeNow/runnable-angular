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
  //    'userName':    '=',
  //    'projectName': '=',
  //    'branchName':  '=',
  //    'buildId':     '=',
  //    'files':        '='
      'build': '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      // file can be dir or file
      actions.clickFile = function (file) {
      };

      $scope.$watch('build.attrs.owner', function (newval, oldval) {
        if (newval) {
          fetchData();
        }
      }, false);

      function fetchData () {
        data.build = $scope.build;
        async.waterfall([
          holdUntilAuth,
          function fetchVersion (thisUser, cb) {
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

    }
  };
}
