'use strict';

require('app')
  .factory('fetchTransformRules', fetchTransformRules);

function fetchTransformRules(
  $q,
  $timeout
) {
  return function () {
    var defer = $q.defer;
    $timeout(function () {
      defer.resolve({
        exclude: ['/cheese/butter.js', '/hello/operator.jade'],
        replace: [
          {
            action: 'replace',
            search: 'this.username()',
            replace: 'My name, bitch',
            exclude: ['/butter/scotch.jsp']
          },
          {
            action: 'replace',
            search: 'localhost',
            replace: 'staging-codenow.runnableapp.com',
            exclude: []
          }
        ],
        rename: [
          {
            action: 'rename',
            source: '/this/mellow.jpg',
            dest: './hello/have.js'
          }
        ]
      });
    }, 1000);
    return defer.promise;
  };
}

function createTransformRule(
  $q,
  $timeout
) {
  return function (rule) {
    var defer = $q.defer;
    $timeout(function () {
      var value;
      if (rule.action === 'replace') {
        value = {
          action: 'replace',
          search: 'this.username()',
          replace: 'My name, bitch',
          exclude: ['/butter/scotch.jsp']
        };
      } else {
        value = {
          action: 'rename',
          source: '/this/mellow.jpg',
          dest: './hello/have.js'
        };
      }
      defer.resolve(value);
    }, 1000);
    return defer.promise;
  };
}

function testRenameTransformRule(
  $q,
  $timeout
) {
  return function (rule) {
    var defer = $q.defer;
    $timeout(function () {
      defer.resolve([{
        from: 'build/index.html',
        to: 'build/index.sass'
      }]);
    }, 1000);
    return defer.promise;
  };
}


function testReplaceTransformRule(
  $q,
  $timeout
) {
  return function (rule) {
    var defer = $q.defer;
    $timeout(function () {
      defer.resolve([{
        path: 'build/index.html',
        changes: [{
          deletions: [{
            lineNumber: 1,
            value: '- userName: username'
          }],
          additions: [{
            lineNumber: 1,
            value: '+ userName: account.oauthName()'
          }]
        }, {
          deletions: [{
            lineNumber: 5123,
            value: '- userName: username'
          }],
          additions: [{
            lineNumber: 5123,
            value: '+ userName: account.oauthName()'
          }]
        }]
      }]);
    }, 1000);
    return defer.promise;
  };
}

function deleteTransformRule(
  $q,
  $timeout
) {
  return function (rule) {
    var defer = $q.defer;
    $timeout(function () {
      defer.resolve(true);
    }, 1000);
    return defer.promise;
  };
}
/**
 *
 diff -u -r /Users/ryan/Projects/fs-transform/test/fixtures/test/A /tmp/.test.fs-work.0.05125921848230064/A
 --- /Users/ryan/Projects/fs-transform/test/fixtures/test/A	2015-05-11 13:35:04.000000000 -0700
 +++ /tmp/.test.fs-work.0.05125921848230064/A	2015-05-11 13:35:04.000000000 -0700
 @@ -4,4 +4,4 @@
 Exampel
 Interesting

 -/some/path/foo
 +/path/"bar"
 diff -u -r /Users/ryan/Projects/fs-transform/test/fixtures/test/sub/C /tmp/.test.fs-work.0.05125921848230064/sub/C
 --- /Users/ryan/Projects/fs-transform/test/fixtures/test/sub/C	2015-05-11 13:35:04.000000000 -0700
 +++ /tmp/.test.fs-work.0.05125921848230064/sub/C	2015-05-11 13:35:04.000000000 -0700
 @@ -1,5 +1,5 @@
 File C
 -\sum_{i=10}^{100} i^2
 +\prod_{i=10}^{100} i^2

 Mew
 Mew
 diff -u -r /Users/ryan/Projects/fs-transform/test/fixtures/test/sub/subsub/D /tmp/.test.fs-work.0.05125921848230064/sub/subsub/D
 --- /Users/ryan/Projects/fs-transform/test/fixtures/test/sub/subsub/D	2015-05-11 13:35:04.000000000 -0700
 +++ /tmp/.test.fs-work.0.05125921848230064/sub/subsub/D	2015-05-11 13:35:04.000000000 -0700
 @@ -4,4 +4,4 @@
 File B is good
 Neato

 -"cool"
 +"neat"
 * @param fullDiff
 */
function parseDiff(fullDiff) {

}

