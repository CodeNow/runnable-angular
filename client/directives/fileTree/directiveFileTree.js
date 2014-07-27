require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  $timeout,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      version: '=',
      openFiles: '=',
      build: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      function init() {
        data.rootDir = $scope.version.newDir({
          id: $scope.version.id() + 'newdir',
          isDir: true,
          Key: (new Array(31).join(' ')) + '//' // bs for now
        }, {
          idAttribute: 'id'
        });
      }
      $scope.$watch('version', function (newval, oldval) {
        if (newval) {
          init();
        }
      });

      actions.createFile = function () {
        var name = prompt('please enter name');
        /*
        var file = $scope.version.createFile({
          name: '',
          path: '/test/',
          isDir: true
        }, function () {
        });
        var coll = $scope.version.fetchFiles({path: '/'}, function () {});
        coll.add(file);
        $timeout(function () {
          $scope.$apply();
        });
        */
      };
    }
  };
}
