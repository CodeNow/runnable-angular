'use strict';

describe('BranchTestListController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var $controller;
  var $q;
  var keypather;

  var controller;

  var fetchCommitDataStub;
  var fetchInstanceTestHistoryStub;

  var instance;
  var branch;
  var newCommit;
  var appCodeVersion;

  function initialize() {
    appCodeVersion = {
      attrs: {
        branch: branch,
        commit: '1',
        useLatest: false
      }
    };
    instance = {
      contextVersion: {
        getMainAppCodeVersion: sinon.stub().returns(appCodeVersion),
      },
      attrs: {
        id: "123"
      }
    };
    branch = {
      commits: {
        models: [
          {
            attrs: {
              sha: '0'
            }
          },
          {
            attrs: {
              sha: '1'
            }
          },
          {
            attrs: {
              sha: '2'
            }
          },
          {
            attrs: {
              sha: '3'
            }
          },
          {
            attrs: {
              sha: '4'
            }
          },
          {
            attrs: {
              sha: '5'
            }
          }
        ]
      }
    };
    newCommit = { attrs: { sha: '1' } };

  };

  function initState() {
    angular.mock.module('app');

    angular.mock.module(function ($provide) {
      $provide.factory('fetchCommitData', function ($q) {
        fetchCommitDataStub = {
          activeBranch: sinon.stub().returns(branch),
          activeCommit: sinon.stub().returns($q.when())
        };
        return fetchCommitDataStub;
      });
      $provide.factory('fetchInstanceTestHistory', function ($q) {
        fetchInstanceTestHistoryStub = function() {
          return $q.when([
            {
              commitSha: '1',
              build: {
                stop: new Date(0),
                failed: false
              }
            },
            {
              commitSha: '2',
              build: {
                stop: new Date(),
                failed: true
              }
            },
            {
              commitSha: '3',
              build: {
                stop: new Date(),
                failed: false
              },
              application: {
                exitCode: 1
              }
            },
            {
              commitSha: '4',
              build: {
                stop: new Date(),
                failed: false
              },
              application: {
                exitCode: 0,
                stop: new Date(0)
              }
            },
            {
              commitSha: '5',
              build: {
                stop: new Date(),
                failed: false
              },
              application: {
                exitCode: 0,
                stop: new Date()
              }
            }
          ]);
        };

        return fetchInstanceTestHistoryStub;
      });
    });

    angular.mock.inject(function (
      $compile,
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      keypather = _keypather_;

      $scope = $rootScope.$new();

      controller = $controller('BranchTestListController', {
        $scope: $scope
      }, {
        appCodeVersion: appCodeVersion,
        instance: instance
      });
    });
  };

  beforeEach(function () {
    initialize();
  });

  describe('fetchInstanceTestHistory', function () {
    beforeEach(function () {
      initState();
    });

    it('built results correctly', function () {
      $scope.$digest();
      // No test found
      expect(branch.commits.models[0].attrs.test).to.equal(3);
      // Test found but build exit time of epoch
      expect(branch.commits.models[1].attrs.test).to.equal(3);
      // Build failed is true
      expect(branch.commits.models[2].attrs.test).to.equal(2);
      // // Build passed but exit code > 0
      expect(branch.commits.models[3].attrs.test).to.equal(2);
      // Application stop is epoch
      expect(branch.commits.models[4].attrs.test).to.equal(3);
      expect(branch.commits.models[5].attrs.test).to.equal(1);
    });
  });
});
