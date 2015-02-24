'use strict';

var $controller,
    $scope,
    $window,
    $q;

describe('controllerServerSelection'.underline.bold.blue, function () {
  var ctx = {};
  ctx.fakeuser = {
    attrs: angular.copy(mocks.user),
    oauthName: function () {
      return 'user';
    }
  };
  var fetchInstancesMock = sinon.spy(function () {
    var d = $q.defer();
    d.resolve({});
    return d.promise;
  });

  var mockUser = {
    createBuild: sinon.spy(function(qs, cb) {
      cb();
    })
  };

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('user', mockUser);
      $provide.value('fetchInstances', fetchInstancesMock);
      $provide.value('$stateParams', {
        userName: 'test',
        repo: 'hello'
      });

      $provide.value('user', mockUser);
    });
    angular.mock.inject(function(
      _$controller_,
      _$window_,
      _$q_,
      $rootScope
    ) {
      $controller = _$controller_;
      $window = _$window_;
      $q = _$q_;
      $scope = $rootScope.$new();
    });

    $window.heap = null;

    ctx.controller = $controller('ControllerServerSelection', {
      '$scope': $scope
    });
  });

  describe('basic init', function() {
    it('initalizes properly', function() {
      $scope.$digest();
      expect($scope.fullRepoName).to.equal('test/hello');
      sinon.assert.calledTwice(fetchInstancesMock);
      sinon.assert.notCalled(mockUser.createBuild);
    });

    // Skipping until promises
    it.skip('handles errors properly');
  });

  describe.skip('fork/overwrite', function() {
    it('properly overwrites an instance', function() {
    });
  });
});