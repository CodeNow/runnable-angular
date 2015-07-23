'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;

var User = require('runnable/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();
var User = require('runnable/lib/models/user');
var user = require('../apiMocks').user;

describe('controllerApp'.bold.underline.blue, function () {
  var ctx = {};
  function setup(stateParams, intercom) {
    angular.mock.module('app');
    ctx.fakeuser = new User(angular.copy(apiMocks.user));
    ctx.fakeuser.socket = {
      joinOrgRoom: sinon.spy()
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
    ctx.fakeOrgs = {models: [ctx.fakeOrg1, ctx.fakeOrg2]};
    ctx.stateParams = stateParams || {
      userName: 'username',
      instanceName: 'instancename'
    };
    ctx.fakeErrs = {
      handler: sinon.spy(),
      clearErrors: sinon.spy(),
      errors: []
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('$stateParams', ctx.stateParams);
      $provide.value('user', ctx.fakeuser);
      $provide.value('orgs', ctx.fakeOrgs);
      $provide.value('activeAccount', ctx.fakeuser);
      $provide.value('errs', ctx.fakeErrs);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$window_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
    });
    if ($window.Intercom) {
      sinon.stub($window, 'Intercom', noop);
    }

    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });
    $rootScope.$apply();
  }

  function tearDown () {
    keypather.get($window, 'Intercom.restore()');
  }

  describe('basics'.blue, function () {

    beforeEach(function () {
      // Error when not wrapped
      setup();
    });

    afterEach(function () {
      tearDown();
    });

    it('initalizes $scope.dataApp properly', function () {
      expect($scope.dataApp).to.be.an.Object;
      $rootScope.$digest();
      $scope.dataApp.data.modalError.actions.close();
      sinon.assert.calledOnce(ctx.fakeErrs.clearErrors);
    });

    it('creates a click handler that broadcasts', function () {
      $rootScope.$digest();

      var spy = sinon.spy();
      $scope.$on('app-document-click', spy);

      $scope.dataApp.documentClickEventHandler({
        target: 'foo'
      });

      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[1]).to.equal('foo');
    });


    it('creates an escape button handler that broadcasts', function () {
      $rootScope.$digest();

      var spy = sinon.spy();
      var spy2 = sinon.spy();
      $scope.$on('app-document-click', spy);
      $scope.$on('close-modal', spy2);

      $scope.dataApp.documentKeydownEventHandler({
        keyCode: 27,
        target: 'foo'
      });

      sinon.assert.calledOnce(spy);
      sinon.assert.calledOnce(spy2);
    });

    it('should join the org room for the user', function () {
      sinon.assert.calledOnce(ctx.fakeuser.socket.joinOrgRoom);
    });
  });
});
