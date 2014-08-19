require('app')
  .directive('buildStream', buildStream);
/**
 * @ngInject
 */
function buildStream(
  $rootScope,
  jQuery,
  primus
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      build: '='
    },
    templateUrl: 'viewLogStream',
    link: function ($scope, elem) {

      $scope.stream = {
        finished: false,
        data: ''
      };

      $scope.$watch('build.attrs._id', function (buildId, oldVal) {
        if (buildId) {
          var build = $scope.build;
          if (build.succeeded()) {
            $scope.stream.data = $scope.build.attrs.contextVersions[0].build.log;
            $rootScope.safeApply();
          } else if (build.failed()) {
            var contextVersion = build.contextVersions.models[0];
            if (build.contextVersions.models)
              $scope.stream = {
                data: contextVersion.attrs.build.log ||
                  (contextVersion.attrs.build.error && contextVersion.attrs.build.error.message) ||
                  "Unknown Build Error Occurred"
              };
            // check contextVersions.attrs.build.error for unknown errors
            $rootScope.safeApply();
          } else { // build in progress
            initStream();
          }
        }
      });

      function initStream() {
        var build = $scope.build;
        var buildStream = primus.createBuildStream(build);
        var addToStream = function (data) {
          $scope.stream.data += data;
          $rootScope.safeApply();
          jQuery('html, body').scrollTop(10000);
        };
        buildStream.on('data', addToStream);
        buildStream.on('end', function () {
          build.fetch(function (err) {
            if (err) {
              throw err;
            }
            if (build.failed()) {
              // bad things happened
              addToStream('BUILD BROKEN: Please try again');
            } else {
              // we're all good
              addToStream('BUILD SUCCESSFUL');
            }
            $rootScope.safeApply();
          });
        });
      }
    }
  };
}

function parseReturns(data) {
  if (!data) {
    return null;
  }
  // Split the data by the \n.
  var splitData= data.split('\n');
  var parsedData= '';
  // Each of the strings in the array may have a \r at the end of them
  splitData.forEach(function (line, index){
    if (line) {
      var startCheck = 0;
      // Remove all \r from the beginning of the line
      while(line.charAt(startCheck) === '\r') {
        startCheck++;
      }
      var firstReturn = line.indexOf('\r', startCheck);
      // If the first found return is at the end, or not in it at all, then skip this
      if (line && firstReturn !== -1) {
        // remove the \r from the end of the line
        var endCheck = line.length - 1;
        while (line.charAt(endCheck) === '\r') {
          endCheck--;
        }
        var lastIndex= line.lastIndexOf('\r', endCheck);
        // Now find the last index (which isn't at the beginning or end), and cut off
        // everything before it
        if (lastIndex > 0) {
          // +1 for the last letter, + 1 for the \r at the end
          line = line.slice(lastIndex + 1, endCheck + 2);
        }
      }
      // Since split will cause the last item to be an empty string
      // if the last character was a \n, we add \ns only when this is NOT the
      // last item.  If the last item isn't empty, then it didn't have a \n at
      // the end
      parsedData += line + ((index !== splitData.length -1) ? '\n' : '');
    }
  });
  return parsedData || data;
}

/**
 * This function looks for the last occurrence of \n to reduce what needs to be sent to
 * parseReturns.  This takes all data after the last \n and sends it to be parsed with the new
 * incoming data.  This reduces the amount of text the parser has to go through, since we know
 * we only care about stuff that may be wiped out, and everything that has been through this
 * step before is guaranteed clean.
 * @param data fresh data from the stream
 * @param onScreen currently onscreen data
 * @returns {*} data to be placed on the screen.
 */
function addToTotal(data, onScreen) {
  var lastIndex= onScreen.lastIndexOf('\n');
  if (lastIndex > 0 && lastIndex !== onScreen.length - 1) {
    data = onScreen.slice(lastIndex) + data;
    // +1 to include the \n, since it's the last one on the screen
    onScreen = onScreen.slice(0, lastIndex + 1);
  }
  onScreen += parseReturns(data);
  return onScreen;
}
