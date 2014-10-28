var $ = require('jquery'); // required by brace
require('brace');
require('brace/ext/modelist');
require('brace/ext/searchbox');
require('lib/brace-modes');

require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  async,
  debounce,
  keypather,
  modelist,
  QueryAssist,
  $rootScope,
  $sce,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      isDarkTheme: '='
    /*
      instance: '=',
      build: '=',
      container: '=',
      openItems: '=',
      readOnly: '=',
      update: '=', // true: save file when content changes
      isDarkTheme: '='
    */
    },
    link: function ($scope, element, attrs) {

      var data = $scope.data = {};
      var actions = $scope.actions = {};
      data.readOnly = $scope.readOnly;

      actions.onFocus = function () {
        $rootScope.$broadcast('app-document-click');
      };

      // Wrapper function so we can call setAceMode with both
      //   item *and* _editor
      actions.wrapWithItem = function(item) {
        return function (_editor) {
          actions.setAceMode(_editor, item);
        };
      };

      actions.setAceMode = function (_editor, item) {
        var name = keypather.get(item, 'attrs.name');
        if (name) {
          var mode = modelist.getModeForPath(name).mode;
          _editor.getSession().setMode(mode);
        }
      };

      // allow iframe to load url
      $scope.$sce = $sce;

      var skip = true;
      function updateFile(cb) {
        if (skip) {
          skip = false;
          return;
        }
        var activeFile = $scope.openItems.activeHistory.last();
        if (!$scope.openItems.isFile(activeFile)) {
          return;
        }
        activeFile.update({
          json: {
            body: activeFile.state.body
          }
        }, function (err) {
          if (err) {
            throw err;
          }
          $rootScope.safeApply();
        });
      }
      var updateFileDebounce = debounce(updateFile, 333);

      function fetchFile() {
        var openItems = $scope.openItems;
        var last = openItems.activeHistory.last();
        if (openItems.isFile(last)) {
          last.fetch(function () {
            last.state.reset();
            $rootScope.safeApply();
          });
        }
      }

      $scope.$watch('openItems.activeHistory.last().state.body', function (newVal, oldVal) {
        if (typeof newVal === 'string' && $scope.openItems.activeHistory.last()) {
          if ($scope.update) {
            updateFileDebounce();
          }
        }
      });

      $scope.$watch('openItems.activeHistory.last().id()', function (newVal, oldVal) {
        if (newVal) {
          if (!$scope.update) {
            var file = $scope.openItems.activeHistory.last();
            if (!(file.state && (typeof file.state.body === 'string'))) {
              //fetch only on first select
              skip = false;
              fetchFile();
            }
          } else {
            skip = true;
            fetchFile();
          }
        }
      });






      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      /**
       * use buildId if stateParams.buildId (instance.setup)
       * otherwise fetch instance & build (instance.instance && instance.edit)
       */
      function fetchBuild (cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.instance = instance;
            $scope.build    = instance.build;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchBuild
      ], function (err) {
        if (err) throw err;
        $rootScope.safeApply();
      });

    }
  };
}
