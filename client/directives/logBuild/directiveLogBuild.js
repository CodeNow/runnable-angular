require('app')
  .directive('logBuild', logBuild);
/**
 * @ngInject
 */
function logBuild(
  async,
  helperSetupTerminal,
  primus,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  dockerStreamCleanser,
  user
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: 'viewLogBuild',
    link: function ($scope, elem, attrs) {

      var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mbuild failed\x1b[0m';
      var DEFAULT_INVALID_BUILD_MESSAGE = '\x1b[31;1mPlease build again\x1b[0m';
      var COMPLETE_SUCCESS_MESSAGE = 'Build completed, starting instance...';
      var buildStream;

      /**
       * Creates instance of Terminal w/ default 
       * settings and attaches to elem.
       * - Unbinds events on $destroy
       */
      var terminal = helperSetupTerminal($scope, elem);

      bind(primus, 'offline', function () {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });

      $scope.$on('$destroy', function () {
        if (!buildStream) return;
        buildStream.removeAllListeners();
        buildStream.end();
      });

      async.series([
        fetchUser,
        fetchInstance
      ], function () {
        initializeBuildLogs($scope.build);
      });

      /**
       * helper to always unbind on $destroy
       */
      function bind(obj, event, fn) {
        obj.on(event, fn);
        $scope.$on('$destroy', function () {
          obj.off(event, fn);
        });
      }

      function writeToTerm(output) {
        if (typeof output !== 'string') return;
        terminal.write(output.replace(/\r?\n/g, '\r\n'));
      }

      function showTerminalSpinner() {
        terminal.hideCursor = false;
        terminal.cursorBlink = true;
        terminal.cursorSpinner = true;
        terminal.cursorState = -1;
        terminal.startBlink();
      }

      function subscribeToSubstream(build) {
        if (buildStream) {
          buildStream.removeAllListeners('data');
          terminal.reset();
        }
        //TODO spinner
        buildStream = primus.createBuildStream(build);
        // binds to buildStream.on('data')
        // important to unbind 'data' listener
        // before reinvoking this
        dockerStreamCleanser.cleanStreams(buildStream,
                                          terminal,
                                          'hex',
                                          true);
      }

      function initializeBuildStream(build) {
        subscribeToSubstream(build);
        showTerminalSpinner();
        bind(primus, 'reconnect', function () {
          subscribeToSubstream(build);
        });
        bind(buildStream, 'end', function () {
          terminal.hideCursor = true;
          terminal.cursorBlink = false;
          terminal.cursorSpinner = false;
          terminal.cursorState = 0;
          build.fetch(function (err) {
            if (err) throw err;
            if (!build.succeeded()) {
              writeToTerm(DEFAULT_INVALID_BUILD_MESSAGE);
            } else {
              writeToTerm(COMPLETE_SUCCESS_MESSAGE);
            }
          });
        });
      }

      function initializeBuildLogs(build) {
        var contextVersion = build.contextVersions.models[0];
        if (build.failed() || build.succeeded()) {
          contextVersion.fetch(function (err, data) {
            if (err) throw err;
            if (build.succeeded()) {
              writeToTerm(data.build.log);
            }
            else if(build.failed()) {
              // defaulting behavior selects best avail error msg
              var cbBuild = keypather.get(contextVersion, 'attrs.build');
              var errorMsg = cbBuild.log || keypather.get(cbBuild, 'error.message') || DEFAULT_ERROR_MESSAGE;
              writeToTerm(errorMsg);
            }
          });
        } else {
          initializeBuildStream(build);
        }
      }

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
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
            $scope.build = instance.build;
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

    }
  };
}
