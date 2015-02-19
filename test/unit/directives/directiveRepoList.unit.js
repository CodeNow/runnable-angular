'use strict';

var MockFetch = require('../fixtures/mockFetch');
describe('directiveRepoList'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var thisUser;
  var apiMocks = require('../apiMocks/index');
  var createNewBuildMock = new MockFetch();

  function createBuildObject(json, numberOfAcv) {
    return {
      attrs: json,
      build: sinon.spy(function (opts, cb) {
        cb(null, this);
      }),
      contextVersions: {
        models: [
          createContextVersionObjects(numberOfAcv)
        ]
      },
      id: function () { return 'adsfsd'},
      contexts: {
        models: [
          {
            attrs: {
              name: 'hi'
            }
          }
        ]
      }
    };
  }
  function createContextVersionObjects(numberOfAcv) {
    return {
      attrs: apiMocks.contextVersions.running,
      fetch: sinon.spy(function (cb) {
        cb();
      }),
      appCodeVersions: {
        models: createAppCodeVersionObjects(numberOfAcv),
        findIndex: sinon.spy(function () {
          return;
        })
      }
    };
  }
  function createAppCodeVersionObjects(numberOfAcv) {
    if (numberOfAcv === undefined) {
      numberOfAcv = 1;
    }
    var models = [];
    function cbFunc(cb) {
      cb();
    }
    var x;
    for (x = 0; x < numberOfAcv; x++) {
      models.push({
        attrs: (x % 2 === 0) ?
            apiMocks.appCodeVersions.bitcoinAppCodeVersion : apiMocks.appCodeVersions.differentBitcoinAppCodeVersion,
        fetch: sinon.spy(cbFunc),
        update: sinon.spy(cbFunc),
      });
    }
    return models;
  }
  function createInstanceObject(json) {
    return {
      attrs: json,
      update: sinon.spy(function (opts, cb) {
        cb(null, this);
      })
    };
  }

  function initGlobalState(provideValues, scope) {
    angular.mock.module('app');

    angular.mock.module(function ($provide) {
      $provide.value('$state', provideValues.state);
      $provide.factory('createNewBuild', createNewBuildMock.fetch());
      $provide.factory('fetchCommitData', function () {
        return {
          activeBranch: sinon.spy(function (acv) {
            return null;
          }),
          activeCommit: sinon.spy(function (acv) {
            return null;
          }),
          offset: sinon.spy(),
          branchCommits: sinon.spy()
        };
      });
      $provide.factory('pFetchUser', fixtures.mockFetchUser);
      $provide.factory('fetchOwnerRepos', fixtures.mockFetchOwnerRepos);
    });
    angular.mock.inject(function ($compile, _$rootScope_, $timeout, user){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(mocks.user);

      $rootScope.dataApp = {
        user: thisUser,
        data: {},
        stateParams: {}
      };
      var tpl = directiveTemplate.attribute('repo-list', {
        'loading': 'loading',
        'build': 'build',
        'instance': 'instance'
      });
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  describe('build only'.bold.blue, function () {
    beforeEach(function () {
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.setup'
          }
        }
      }, {
        build: createBuildObject(mocks.builds.new, 0)
      });
    });
    beforeEach(function () {
      $rootScope.$digest();
    });

    it('should show guide', function () {
      expect($elScope.unsavedAcvs.length, 'Unsaved Acvs').to.equal(0);
      expect(element[0].querySelector('.guide'), 'RepoList Guide').to.be.ok;
    });

    it('should show plus', function () {
      expect(element[0].querySelector('.icons-add')).to.be.ok;
    });

    it('should attempt to update the acv object on acv-change', function () {

      var acv = {
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
        update: sinon.spy(function (opts, cb) {
          cb();
        })
      };
      var triggerInstanceUpdateOnRepoCommitChange = $elScope.triggerInstanceUpdateOnRepoCommitChange;
      $elScope.triggerInstanceUpdateOnRepoCommitChange =
          sinon.spy(triggerInstanceUpdateOnRepoCommitChange);
      var updateOpts = 'Hello';
      $scope.$broadcast('acv-change', { acv: acv, updateOpts: updateOpts });
      $scope.$apply();
      sinon.assert.calledWith(acv.update, updateOpts);
      sinon.assert.notCalled($elScope.triggerInstanceUpdateOnRepoCommitChange);
      expect(element[0].querySelector('.btn.btn-xs.orange'), 'Update Button').to.not.be.ok;
    });
  });

  describe('running instance with repo'.bold.blue, function () {
    beforeEach(function () {
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.instance'
          }
        }
      }, {
        build: createBuildObject(mocks.builds.built),
        instance: createInstanceObject(mocks.instances.building)
      });
    });
    beforeEach(function () {
      $rootScope.$digest();
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length, 'RepoList Guide').to.not.be.ok;
    });

    it('should not show plus', function() {
      expect(element[0].querySelector('.icons-add')).to.not.be.ok;
    });

    it('should attempt to trigger a whole new build with 1 ACV', function () {
      var triggerInstanceUpdateOnRepoCommitChange = $elScope.triggerInstanceUpdateOnRepoCommitChange;
      $elScope.triggerInstanceUpdateOnRepoCommitChange =
        sinon.spy(triggerInstanceUpdateOnRepoCommitChange);

      expect($elScope.unsavedAcvs.length, 'Unsaved Acvs').to.equal(1);
      $elScope.unsavedAcvs[0].unsavedAcv = { name: 'hello '};

      $scope.$broadcast('acv-change', { acv: $elScope.unsavedAcvs[0].acv, updateOpts: {} });
      $scope.$apply();
      sinon.assert.notCalled($elScope.unsavedAcvs[0].acv.update);
      sinon.assert.calledOnce($elScope.triggerInstanceUpdateOnRepoCommitChange);
      expect($elScope.loading).to.be.true;
      expect(element[0].querySelector('.btn.btn-xs.orange'), 'Update Button').to.not.be.ok;

      var newBuild = createBuildObject(apiMocks.builds.new);
      createNewBuildMock.triggerPromise(newBuild);
      $scope.$apply();
      sinon.assert.calledOnce(newBuild.build);
      $scope.$apply();
      sinon.assert.calledOnce($elScope.instance.update);
      $scope.$apply();
      expect($elScope.loading, 'Loading').to.be.false;

    });
    it('should show the update button with 2 acvs', function () {
      $scope.build = createBuildObject(mocks.builds.built, 2);
      $scope.$apply();

      var triggerInstanceUpdateOnRepoCommitChange = $elScope.triggerInstanceUpdateOnRepoCommitChange;
      $elScope.triggerInstanceUpdateOnRepoCommitChange =
        sinon.spy(triggerInstanceUpdateOnRepoCommitChange);

      expect($elScope.unsavedAcvs.length, 'Unsaved Acvs').to.equal(2);
      $elScope.unsavedAcvs[0].unsavedAcv = { name: 'hello '};
      $scope.$apply();
      expect(element[0].querySelector('.btn.btn-xs.orange'), 'Update Button').to.be.ok;

      $scope.$broadcast('acv-change', { acv: $elScope.unsavedAcvs[0].acv, updateOpts: {} });
      $scope.$apply();
      sinon.assert.notCalled($elScope.unsavedAcvs[0].acv.update);
      sinon.assert.notCalled($elScope.triggerInstanceUpdateOnRepoCommitChange);
      expect($elScope.loading, 'loading').to.not.be.ok;

    });
  });

  describe('editing instance with repo'.bold.blue, function() {
    beforeEach(function () {
      var instance = createInstanceObject(mocks.instances.building);
      instance.build = createBuildObject(mocks.builds.setup);
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.instanceEdit'
          }
        }
      }, {
        build: createBuildObject(mocks.builds.built),
        instance: instance
      });
    });
    beforeEach(function() {
      $rootScope.$digest();
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length, 'RepoList Guide').to.not.be.ok;
    });

    it('should show plus', function() {
      expect(element[0].querySelector('.icons-add')).to.be.ok;
    });
    it('should attempt to update the acv object on acv-change', function () {
      var acv = {
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
        update: sinon.spy(function (opts, cb) {
          cb();
        })
      };
      var triggerInstanceUpdateOnRepoCommitChange = $elScope.triggerInstanceUpdateOnRepoCommitChange;
      $elScope.triggerInstanceUpdateOnRepoCommitChange =
        sinon.spy(triggerInstanceUpdateOnRepoCommitChange);
      var updateOpts = 'Hello';
      $scope.$broadcast('acv-change', { acv: acv, updateOpts: updateOpts });
      $scope.$apply();
      sinon.assert.calledWith(acv.update, updateOpts);
      sinon.assert.notCalled($elScope.triggerInstanceUpdateOnRepoCommitChange);
      expect(element[0].querySelector('.btn.btn-xs.orange'), 'Update Button').to.not.be.ok;
    });
  });
});
