'use strict';

var jQuery  = require('jquery');
var sinon = require('sinon');
var pluck = require('101/pluck');
var find = require('101/find');
var matches = function (regexp) {
  return function (v) {
    return regexp.test(v);
  };
};

// injector-provided
var $compile,
    $filter,
    $httpBackend,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;
var mockPrimus = new fixtures.MockPrimus();

describe('directiveLogBuild'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.instance'
        }
      });

      $provide.value('$stateParams', {
        userName: 'username',
        instanceName: 'instancename'
      });

      $provide.value('primus', mockPrimus);
    });
    angular.mock.inject(function (
      _$compile_,
      _$filter_,
      _$httpBackend_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_,
      _user_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
      user = _user_;
    });

    /**
     * API Requests
     * - GET user
     * - GET instance
     */
    var userUrl = host + '/users/me?';
    $httpBackend
      .whenGET(userUrl)
      .respond(mocks.user);

    var instanceUrl = host + '/instances?githubUsername=username&name=instancename';
    $httpBackend
      .whenGET(instanceUrl)
      .respond([mocks.instances.building]);

    modelStore.reset();

    ctx.element = angular.element(ctx.template);
    ctx.element = $compile(ctx.element)($scope);
    $scope.$digest();
    $httpBackend.flush();
    ctx.$element = jQuery(ctx.element);
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate.attribute('log-build');
  });
  beforeEach(injectSetupCompile);

  it('basic dom', function() {
    expect(ctx.$element).to.be.ok;
    expect(ctx.$element.hasClass('ng-isolate-scope')).to.equal(true);
    var $el = ctx.$element.find('> div.terminal');
    expect($el.length).to.be.ok;
  });

  it('basic scope', function() {
    expect($elScope).to.have.property('user');
    expect($elScope).to.have.property('instance');
  });

  describe('destroy', function() {
    var origBuildStream;
    beforeEach(function () {
      origBuildStream = $elScope.buildStream;
      $elScope.buildStream = {}; // mock buildStream
    });
    afterEach(function () {
      $elScope.buildStream = origBuildStream;
    });
    it('should clean up buildStream', function() {
      var removeAllSpy = sinon.spy();
      var endSpy = sinon.spy();
      $elScope.buildStream.removeAllListeners = removeAllSpy;
      $elScope.buildStream.end = endSpy;
      $elScope.$destroy();
      expect(removeAllSpy.called).to.be.ok;
      expect(endSpy.called).to.be.ok;
    });
  });

  describe('primus goes offline', function() {
    it('should display disconnect message when primus goes offline', function() {
      mockPrimus.emit('offline');
      var $el = ctx.$element.find('> div.terminal');
      expect($el.length).to.be.ok;
      var lostConnectionLine = $el.children().toArray().map(pluck('innerText')).find(matches(/LOST.*CONNECTION/));
      expect(lostConnectionLine).to.be.ok;
    });
  });
});
