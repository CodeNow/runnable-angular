'use strict';

var $controller,
    $rootScope,
    $scope,
    $timeout;
var $window;
var keypather;
var apiMocks = require('../apiMocks/index');
var fetchUserMock = new (require('../fixtures/mockFetch'))();
var fetchStackInfoMock = new (require('../fixtures/mockFetch'))();
var fetchContextsMock = new (require('../fixtures/mockFetch'))();
var fetchInstancesMock = new (require('../fixtures/mockFetch'))();

var stacks = angular.copy(apiMocks.stackInfo);
var thisUser = runnable.newUser(apiMocks.user);

describe.only('environmentController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {
    ctx.$log = {
      error: sinon.spy()
    };
    ctx.errs = {
      handler: sinon.spy()
    };

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('favico', {
        reset : sinon.spy(),
        setImage: sinon.spy(),
        setInstanceState: sinon.spy()
      });
      $provide.value('pageName', {
        setTitle: sinon.spy()
      });
      $provide.factory('pFetchUser', fetchUserMock.fetch());
      $provide.factory('fetchStackInfo', fetchStackInfoMock.fetch());
      $provide.factory('fetchInstances', fetchInstancesMock.fetch());
      $provide.factory('fetchContexts', fetchContextsMock.fetch());
      $provide.value('$log', ctx.$log);
      $provide.value('errs', ctx.errs);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$timeout_,
      _$window_
    ) {
      $timeout = _$timeout_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
    });

    var ca = $controller('EnvironmentController', {
      '$scope': $scope
    });
  }

  describe('basics', function () {
    it('should attempt all of the required fetches, plus add its actions to the scope', function () {

      setup();
      $rootScope.$digest();
      expect($scope).to.have.property('data');
      expect($scope.data).to.have.property('instances');
      expect($scope).to.have.property('state');
      expect($scope.state).to.have.property('validation');
      expect($scope.state.validation).to.have.property('env');
      expect($scope).to.have.property('actions');
      expect($scope.actions.deleteServer).to.be.ok;
      expect($scope.actions.createAndBuild).to.be.ok;

      expect($scope.data.loadingNewServers).to.be.true;

      expect($scope.data.allDependencies).to.not.be.ok;
      var templateInstances = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      templateInstances.githubUsername = 'HelloRunnable';
      fetchInstancesMock.triggerPromise(templateInstances);
      $rootScope.$digest();
      expect($scope.data.allDependencies).to.equal(templateInstances);

      fetchUserMock.triggerPromise(thisUser);
      $rootScope.$digest();
      expect($scope.user).to.equal(thisUser);


      fetchStackInfoMock.triggerPromise(stacks);
      $rootScope.$digest();
      expect($scope.data.stacks).to.equal(stacks);
      var masterPods = runnable.newInstances(
        [apiMocks.instances.building, apiMocks.instances.runningWithContainers],
        {noStore: true}
      );
      masterPods.githubUsername = thisUser.oauthName();
      fetchInstancesMock.triggerPromise(masterPods);
      $rootScope.$digest();
      expect($scope.data.instances).to.equal(masterPods);
      expect($scope.data.loadingNewServers).to.be.false;

      var sourceContexts = [{
        attrs: 'awesome'
      }];
      fetchContextsMock.triggerPromise(sourceContexts);
      $rootScope.$digest();
      expect($scope.data.sourceContexts).to.equal(sourceContexts);
    });
  });

  describe('actions', function () {
    it('should delete a server', function () {
      setup();
      $rootScope.$digest();
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      instance.destroy = sinon.spy(function (cb) {
        cb();
      });
      sinon.stub(window, 'confirm', function () {
        return true;
      });
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);
      var server = {
        instance: instance
      };
      $scope.actions.deleteServer(server);
      $rootScope.$digest();
      sinon.assert.calledOnce(closePopoverSpy);
      $timeout.flush();
      $rootScope.$digest();
      sinon.assert.calledOnce(window.confirm);
      $rootScope.$digest();
      sinon.assert.calledOnce(instance.destroy);

    });
  });
});
