'use strict';

var $controller,
    $rootScope,
    $timeout,
    $scope,
    $localStorage,
    keypather,
    $state,
    $q,
    promisify,
    mockOrg,
    mockBranch,
    mockBranches,
    currentOrg;
var isRunnabotPartOfOrgStub;
var fetchRepoBranchesStub;
var fetchGitHubRepoBranchesStub;
var fetchInstancesByComposeStub;
var ahaGuideStub;
var featureFlags = {
  flags: {}
};
var apiMocks = require('../apiMocks/index');
var mockFetch = new (require('../fixtures/mockFetch'))();
var runnable = window.runnable;

/**
 * Things to test:
 * Since this controller is pretty simple, we only need to test it's redirection
 */
describe('ControllerInstances'.bold.underline.blue, function () {
  var ctx = {};
  var CIS;
  function setup(activeAccountUsername, localStorageData) {
    mockFetch.clearDeferer();
    angular.mock.module('app');
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };

    ctx.userList = {
      user: ctx.fakeuser,
      org1: ctx.fakeOrg1,
      org2: ctx.fakeOrg2
    };

    ctx.instanceLists = {
      user: {
        models: [{
          attrs: angular.copy(apiMocks.instances.running)
        }, {
          attrs: angular.copy(apiMocks.instances.stopped)
        }]
      },
      org1: {
        models: [{
          attrs: angular.copy(apiMocks.instances.building)
        }],
      },
      org2: {
        models: []
      }
    };

    var mockInstances = {
      models: [],
      on: sinon.spy(),
      off: sinon.spy()
    };
    ctx.setupInstanceResponse = function(username, cb) {
      return function (overrideUsername) {
        cb(null, ctx.instanceLists[overrideUsername || username], overrideUsername || username);
      };
    };
    ctx.stateParams = {
      userName: activeAccountUsername || 'user'
    };
    localStorageData = angular.extend({}, localStorageData, {
      $default: sinon.spy()
    });
    mockOrg = {
      github: {
        fetchRepo: sinon.stub()
      },
      poppa: {
        attrs: {
          metadata: {
            hasCompletedDemo: true
          }
        }
      },
      isBillingVisible: sinon.stub().returns(true)
    };
    mockBranch = {
      name: 'mockBranch',
      commit: {
        sha: '6e0c5e3778b83f128f6f14c311d5728392053581',
        url: 'https://api.github.com/repos/cflynn07/bitcoin/commits/6e0c5e3778b83f128f6f14c311d5728392053581'
      }
    };
    var mockBranch2 = {
      name: 'AnotherCoolmockBranch',
      commit: {
        sha: '6e0c5e3778b83f128f6f14c311d5728392053777',
        url: 'https://api.github.com/repos/cflynn07/bitcoin/commits/6e0c5e3778b83f128f6f14c311d5728392053777'
      }
    };
    mockBranches = [mockBranch];
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchInstancesByPod', mockFetch.fetch());
      $provide.factory('fetchInstances', function ($q) {
        return function () {
          return $q.when(mockInstances);
        };
      });
      $provide.factory('promisify', function ($q) {
        var promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
      $provide.factory('featureFlags', function () {
        return featureFlags;
      });
      $provide.factory('fetchGitHubRepoBranches', function ($q) {
        fetchGitHubRepoBranchesStub = sinon.stub().returns($q.when([ mockBranch ]));
        return fetchGitHubRepoBranchesStub;
      });
      $provide.factory('fetchInstancesByCompose', function ($q) {
        fetchInstancesByComposeStub = sinon.stub().returns($q.when({ defaultBranches: [], featureBranches: []}));
        return fetchInstancesByComposeStub;
      });
      $provide.value('currentOrg', mockOrg);
      $provide.value('favico', {
        reset : sinon.spy(),
        setInstanceState: sinon.spy()
      });
      $provide.value('$stateParams', ctx.stateParams);
      $provide.value('$localStorage', localStorageData);
      $provide.factory('ahaGuide', function ($q) {
        ahaGuideStub = {
          endGuide: sinon.stub(),
          isInGuide: sinon.stub(),
          isAddingFirstBranch: sinon.stub(),
          isSettingUpRunnabot: sinon.stub()
        };
        return ahaGuideStub;
      });

      $provide.value('user', ctx.fakeuser);
      $provide.value('activeAccount', ctx.fakeuser);

      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when());
        return isRunnabotPartOfOrgStub;
      });
      $provide.factory('fetchRepoBranches', function($q) {
        fetchRepoBranchesStub = sinon.stub().returns($q.when({
          models: apiMocks.branches.bitcoinRepoBranches
        }));
        return fetchRepoBranchesStub;
      });
      $provide.factory('setLastOrg', function ($q) {
        return sinon.stub().returns($q.when());
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$localStorage_,
      _keypather_,
      _$timeout_,
      _$state_,
      _$q_
    ) {
      keypather = _keypather_;
      $q = _$q_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $localStorage = _$localStorage_;
      $timeout = _$timeout_;
      $state = _$state_;
    });

    if (activeAccountUsername) {
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList[activeAccountUsername]);
    }
    $state.params = ctx.stateParams;
    $state.current.name = 'base.instances';
    ctx.fakeGo = sinon.stub($state, 'go');
    CIS = $controller('ControllerInstances', {
      '$scope': $scope,
      '$rootScope': $rootScope,
      '$state': $state,
      '$stateParams': ctx.stateParams,
      '$localStorage': $localStorage
    });
    $rootScope.$digest();
  }
  describe('No local storage options'.blue, function () {
    it('should not navigate when the state changes before the instances return ', function () {
      setup('SomeKittens');
      $rootScope.$digest();
      var userInstance = runnable.newInstance(apiMocks.instances.running, {noStore: true});
      userInstance.attrs.createdBy.username = 'SomeKittens';
      var many = runnable.newInstances(
        [userInstance, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      sinon.stub($state, 'includes')
        .withArgs('instances').returns(true)
        .withArgs('instance').returns(false);

      ctx.stateParams.userName = 'NotSomeKittens';
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      sinon.assert.neverCalledWith(ctx.fakeGo, 'base.instances.instance', {
        userName: 'SomeKittens',
        instanceName: 'spaaace'
      });
    });
  });
  describe('local storage options'.blue, function () {
    it('should navigate based on local storage');
  });
  describe('multiple requests for different active accounts'.blue, function () {
    it('should only care about the last requested user, even when the responses are out of order', function () {
      setup('org1');
      $rootScope.$digest();

      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });

      // Change the user
      ctx.stateParams.userName = 'org2';
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList.org2);

      $controller('ControllerInstances', {
        '$scope': $scope,
        '$rootScope': $rootScope,
        '$state': $state,
        '$stateParams': ctx.stateParams,
        '$localStorage': $localStorage
      });

      $rootScope.$digest();

      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.instance', {
        userName: 'org1',
        instanceName: 'spaaace'
      });

      var runnable2 = new (require('@runnable/api-client'))('http://example3.com/');
      var many2 = runnable2.newInstances(
        [],
        {noStore: true, reset: true}
      );
      many2.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      mockFetch.triggerPromise(many2);
      $rootScope.$digest();
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.new', {
        userName: 'org2'
      });
    });
  });

  describe('branch launch popover', function() {

    var childInstance;
    var childInstance2;
    var childInstance3;
    var masterInstance;
    var masterInstance2;

    beforeEach(function() {
      childInstance = {
        attrs: {
          name: 'feature-AWESOME',
          lowerName: 'feature-awesome'
        },
        getBranchName: sinon.stub().returns('henry\'s branch')
      };
      childInstance2 = {
        attrs: {
          name: 'deezNutz',
          lowerName: 'deeznutz'
        },
        getBranchName: sinon.stub().returns('olive branch')
      };
      childInstance3 = {
        attrs: {
          name: 'mockBranch-PostgreSQL'
        }
      };
      masterInstance = {
        getRepoAndBranchName: sinon.stub().returns('master'),
        getRepoName: sinon.stub().returns('main'),
        getBranchName: sinon.stub().returns('master'),
        attrs: {
          name: 'MyFirstNodeAPI',
          lowerName: 'myfirstnodeapi'
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns({
            attrs: {
              repo: 'myOrg/main'
            }
          })
        },
        children: {
          models: [ childInstance, childInstance2 ]
        }
      };
      masterInstance2 = {
        getRepoAndBranchName: sinon.stub().returns(null),
        attrs: {
          name: 'PostgreSQL',
          lowerName: 'postgresql',
          shouldNotAutofork: false
        },
        children: {
          models: [childInstance3]
        },
        fork: sinon.stub(),
        update: sinon.stub()
      };
    });

    it('should fetch branches for an instance when popInstanceOpen is called', function () {
      setup('myOrg');
      mockOrg.github.fetchRepo.returns($q.when(true));
      CIS.popInstanceOpen(masterInstance);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchGitHubRepoBranchesStub);
      expect(CIS.instanceBranches).to.deep.equal(mockBranches);
      expect(CIS.totalInstanceBranches).to.equal(mockBranches.length);
    });

    it('should not return branches that were already launched', function () {
      setup('myOrg');
      mockBranches[0].name = 'henry\'s branch';

      CIS.instanceBranches = CIS.getUnbuiltBranches(masterInstance, mockBranches);
      $rootScope.$digest();
      expect(CIS.instanceBranches.length).to.equal(mockBranches.length - 1);
    });

    it('should build a new instance', function () {
      setup('myOrg');

      CIS.poppedInstance = masterInstance2;
      var closePopoverStub = sinon.stub();

      masterInstance2.fork.returns($q.when(masterInstance2));

      CIS.forkBranchFromInstance(mockBranch, closePopoverStub);
      $rootScope.$digest();
      sinon.assert.calledOnce(masterInstance2.fork);
      sinon.assert.calledWithExactly(masterInstance2.fork, mockBranch.name, mockBranch.commit.sha);
      sinon.assert.calledOnce(closePopoverStub);
    });

    it('should set the instance\'s autofork property', function () {
      setup('myOrg');
      CIS.poppedInstance = masterInstance2;
      masterInstance2.update.returns($q.when(true));

      expect(CIS.poppedInstance.attrs.shouldNotAutofork).to.equal(false);
      CIS.setAutofork();
      $rootScope.$digest();
      expect(CIS.poppedInstance.attrs.shouldNotAutofork).to.equal(true);
      sinon.assert.calledOnce(masterInstance2.update);
      sinon.assert.calledWithExactly(masterInstance2.update, {shouldNotAutofork: masterInstance2.attrs.shouldNotAutofork});
    });
  });

  describe('using various searches in the search filter'.blue, function () {
    var childInstance;
    var childInstance2;
    var masterInstance;
    var masterInstance2;

    beforeEach(function () {
      setup('Myztiq');
      childInstance = {
        getBranchName: sinon.stub().returns('awesome')
      };
      childInstance2 = {
        getBranchName: sinon.stub().returns('deeznutz')
      };
      masterInstance = {
        getRepoAndBranchName: sinon.stub().returns('master'),
        attrs: {
          name: 'MyFirstNodeAPI',
          lowerName: 'myfirstnodeapi'
        },
        children: {
          models: [ childInstance, childInstance2 ]
        }
      };
      masterInstance2 = {
        getRepoAndBranchName: sinon.stub().returns(null),
        attrs: {
          name: 'PostgreSQL',
          lowerName: 'postgresql'
        },
        children: {
          models: []
        }
      };
    });

    it('should return instance when nothing is searched', function () {
      CIS.searchBranches = null;
      var result = CIS.filterMasterInstance(masterInstance);
      expect(masterInstance.getRepoAndBranchName.called).to.deep.equal(false);
      expect(result).to.deep.equal(true);
    });

    it('should not return an instance when garbage is searched', function () {
      CIS.searchBranches = 'as@#!df';
      var result = CIS.filterMasterInstance(masterInstance);
      expect(masterInstance.getRepoAndBranchName.called).to.deep.equal(true);
      expect(result).to.deep.equal(false);
    });

    it('should return instance when part of master is searched', function () {
      CIS.searchBranches = 'mast';
      var result = CIS.filterMasterInstance(masterInstance);
      expect(masterInstance.getRepoAndBranchName.called).to.deep.equal(true);
      expect(result).to.deep.equal(true);
    });

    it('should return instance when UPPERCASE is used', function () {
      CIS.searchBranches = 'MASTER';
      var result = CIS.filterMasterInstance(masterInstance);
      expect(masterInstance.getRepoAndBranchName.called).to.deep.equal(true);
      expect(result).to.deep.equal(true);
    });

    it('should return instance when branch name is UPPERCASE', function () {
      masterInstance.getRepoAndBranchName = sinon.stub().returns('MASTER');
      CIS.searchBranches = 'master';
      var result = CIS.filterMasterInstance(masterInstance);
      expect(masterInstance.getRepoAndBranchName.called).to.deep.equal(true);
      expect(result).to.deep.equal(true);
    });

    it('should return all masterInstances', function () {
      CIS.instancesByPod = {
        models: [ masterInstance, masterInstance2 ]
      };
      CIS.searchBranches = null;
      var results = CIS.getFilteredInstanceList();
      expect(results.length).to.deep.equal(2);
    });

    it('should return only one masterInstance with a branch containing "MyFirst"', function () {
      CIS.instancesByPod = { models: [ masterInstance, masterInstance2 ] };
      CIS.searchBranches = 'MyFirst';
      var results = CIS.getFilteredInstanceList();
      expect(results.length).to.deep.equal(1);
    });

    it('should still return only one masterInstance with a branch containing "myfirst"', function () {
      CIS.instancesByPod = { models: [ masterInstance, masterInstance2 ] };
      CIS.searchBranches = 'myfirst';
      var results = CIS.getFilteredInstanceList();
      expect(results.length).to.deep.equal(1);
    });

    it('should only show parents matching the search query', function () {
      var searchTerms = [ null, 'DEEZ', 'post', 'awes'];
      var results = searchTerms.map(function (search) {
        CIS.searchBranches = search;
        return [ CIS.shouldShowParent(masterInstance), CIS.shouldShowParent(masterInstance2)];
      });
      expect(results[0]).to.deep.equal([true, true], 'null');
      expect(results[1]).to.deep.equal([true, false], 'DEEZ');
      expect(results[2]).to.deep.equal([false, false], 'post');
      expect(results[3]).to.deep.equal([true, false], 'awes');
    });

    it('should only show children matching the search query'.green, function () {
      var searchTerms = [ null, 'DEEZ', 'post', 'FEATURE', 'awes'];
      var results = searchTerms.map(function (search) {
        CIS.searchBranches = search;
        return [CIS.shouldShowChild(childInstance), CIS.shouldShowChild(childInstance2)];
      });
      expect(results[0]).to.deep.equal([true, true], 'null');
      expect(results[1]).to.deep.equal([false, true], 'DEEZ');
      expect(results[2]).to.deep.equal([false, false], 'post');
      expect(results[3]).to.deep.equal([false, false], 'FEATURE');
      expect(results[4]).to.deep.equal([true, false], 'aws');
    });
  });
});
