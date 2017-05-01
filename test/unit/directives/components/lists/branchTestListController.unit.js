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
  var tests;
  var newCommit;
  var appCodeVersion;

  var jesusBirthday = '0001-01-01T00:00:00Z';

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
    tests = [
      {
        commitSha: '1',
        build: {
          stop: jesusBirthday,
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
          stop: jesusBirthday
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
    ];
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
          return $q.when(tests);
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
      expect(branch.commits.models[0].test).to.equal(null);
      // Test found but build exit time of jesus birthday
      expect(branch.commits.models[1].test).to.equal('unknown');
      // Build failed is true
      expect(branch.commits.models[2].test).to.equal('failed');
      // // Build passed but exit code > 0
      expect(branch.commits.models[3].test).to.equal('failed');
      // Application stop is jesus birthday
      expect(branch.commits.models[4].test).to.equal('unknown');
      expect(branch.commits.models[5].test).to.equal('passed');
    });
  });
});
