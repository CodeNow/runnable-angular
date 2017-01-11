'use strict';

var apiMocks = require('../apiMocks/index');
var $controller;
var $q;
var $rootScope;
var $scope;
var $stateMock;
var $timeout;
var currentOrgMock;
var DBC;
var demoFlowServiceMock;
var fetchInstancesByPodStub;
var fetchRepoBranchesStub;
var githubStub;
var promisifyMock;
var keypather;
var loadingMock;
var branchMock;
var watchOncePromiseStub;
var instanceMock = {
  attrs: {
    dependencies: []
  },
  children: {
    models: [{
      isolation: {
        instances: {
          fetch: sinon.stub().returns({
            getName: sinon.stub().returns('way back')
          })
        }
      },
      getName: sinon.stub().returns('way back')
    }]
  },
  contextVersion: {
    getMainAppCodeVersion: sinon.stub().returns({
      attrs: {
        repo: 'this/isarepo!'
      }
    })
  },
  getRepoName: sinon.stub().returns('isarepo!'),
  getName: sinon.stub().returns('henrys branch')
};
var featureFlagsMock = {
  flags: {
    demoMultiTierPRLink: true

  }
};
var shouldAddPR = true;


describe('DemoAddBranchController'.bold.underline.blue, function () {
  
  function setup() {

    angular.mock.module('app', function ($provide) {
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
      $provide.factory('github', function ($q) {
        githubStub = {
          createNewBranch: sinon.stub().returns($q.when(true))
        };
        return githubStub;
      });
      $provide.factory('$state', function () {
        $stateMock = {
          go: sinon.stub()
        };
        return $stateMock;
      })
      $provide.factory('demoFlowService', function ($q) {
        demoFlowServiceMock = {
          hasAddedBranch: sinon.stub(),
          shouldAddPR: sinon.stub().returns(shouldAddPR),
          submitDemoPR: sinon.stub().returns($q.when(instanceMock)),
          endDemoFlow: sinon.stub().returns($q.when(true)),
        };
        return demoFlowServiceMock;
      });
      $provide.factory('loading', function () {
        return function () {return true;};
      });
      $provide.factory('currentOrg', function ($q) {
        currentOrgMock = {
          github: {
            fetchRepo: sinon.stub().returns($q.when({
              fetchRepo: sinon.stub().returns(function () {
                return {
                  fetchBranch: sinon.stub().returns($q.when(function () {
                    return branchMock;
                  }))
                }
              })
            }))
          }
        }
        return currentOrgMock;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instanceMock));
        return fetchInstancesByPodStub;
      });
      $provide.factory('fetchRepoBranches', function ($q) {
        fetchRepoBranchesStub = sinon.stub().returns($q.when(true));
        return fetchRepoBranchesStub;
      });
      $provide.factory('watchOncePromise', function ($q) {
        watchOncePromiseStub = sinon.stub().returns($q.when(instanceMock));
        return watchOncePromiseStub;
      })
    });
    angular.mock.inject(function (
      _$controller_,
      _$q_,
      _$rootScope_,
      _keypather_,
      _$state_,
      _$timeout_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $timeout = _$timeout_;
    });

    DBC = $controller('DemoAddBranchController', {
      '$scope': $scope
    });

    DBC.instance = instanceMock;
    DBC.userName = 'heavenstobetsy';
  }

  describe('fetching instances on load when submitting a PR'.blue, function () {
    beforeEach(setup);

    it('should call fetch instances and change state for personal account', function () {
      $rootScope.$digest();
      sinon.assert.called(fetchInstancesByPodStub);
      sinon.assert.called(watchOncePromiseStub);
      sinon.assert.called(demoFlowServiceMock.hasAddedBranch);
      sinon.assert.called(demoFlowServiceMock.shouldAddPR);
      sinon.assert.called(demoFlowServiceMock.submitDemoPR);
      sinon.assert.notCalled(demoFlowServiceMock.endDemoFlow);
      sinon.assert.called($stateMock.go);
      sinon.assert.calledWithExactly($stateMock.go, 
        'base.instances.instance',
        {
          instanceName: 'way back'
        }
      );
    });

    it('should return true when calling shouldUseBranchForPR', function () {
      var shouldUseBranchForPR = DBC.shouldUseBranchForPR();
      expect(shouldUseBranchForPR).to.equal(true);
      sinon.assert.called(demoFlowServiceMock.shouldAddPR);
    });

    it('should return the right branch name', function () {
      var branchName = DBC.getBranchName();
      expect(branchName).to.equal('dark-theme');
    });

    it('should not return a new branch checkout command', function () {
      var newBranchString = DBC.getNewBranchString();
      expect(newBranchString).to.equal('');
    });

    it('should create a commit for clone copy text', function () {
      var cloneCopyText = DBC.getBranchCloneCopyText();
      expect(cloneCopyText).to.equal('git clone https://github.com/heavenstobetsy/isarepo!.git\r\ncd isarepo!\r\ngit checkout dark-theme\r\necho \':)\' >> README.md\r\ngit add -u\r\ngit commit -m \'a friendlier README\'\r\ngit push origin dark-theme;');
    });

    it('should not call createNewBranch', function () {
      DBC.createNewBranch();
      sinon.assert.notCalled(githubStub.createNewBranch);
    });
  });

  describe('fetching instances on load when not submitting a PR '.blue, function () {
    beforeEach(function () {
      shouldAddPR = false;
      setup();
    });

    it('should call fetch instances and change state for personal account', function () {
      $rootScope.$digest();
      sinon.assert.called(fetchInstancesByPodStub);
      sinon.assert.called(watchOncePromiseStub);
      sinon.assert.called(demoFlowServiceMock.hasAddedBranch);
      sinon.assert.called(demoFlowServiceMock.shouldAddPR);
      sinon.assert.notCalled(demoFlowServiceMock.submitDemoPR);
      sinon.assert.called($stateMock.go);
      sinon.assert.calledWithExactly($stateMock.go, 
        'base.instances.instance',
        {
          instanceName: 'way back'
        }
      );
    });

    it('should return false when calling shouldUseBranchForPR', function () {
      var shouldUseBranchForPR = DBC.shouldUseBranchForPR();
      expect(shouldUseBranchForPR).to.equal(false);
      sinon.assert.called(demoFlowServiceMock.shouldAddPR);
    });

    it('should return the right branch name', function () {
      var branchName = DBC.getBranchName();
      expect(branchName).to.equal('my-branch');
    });

    it('should return a new branch checkout command', function () {
      var newBranchString = DBC.getNewBranchString();
      expect(newBranchString).to.equal('-b ');
    });

    it('should not create a commit for clone copy text', function () {
      var cloneCopyText = DBC.getBranchCloneCopyText();
      expect(cloneCopyText).to.equal('git clone https://github.com/heavenstobetsy/isarepo!.git\r\ncd isarepo!\r\ngit checkout -b my-branch\r\ngit push origin my-branch;');
    });

    it('should call createNewBranch', function () {
      DBC.createNewBranch();
      sinon.assert.called(githubStub.createNewBranch);
    });
  });

});
