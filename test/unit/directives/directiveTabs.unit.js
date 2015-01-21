'use strict';

var jQuery  = require('jquery');

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

describe('directiveTabs'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
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

    ctx.element = angular.element(ctx.template);
    ctx.element = $compile(ctx.element)($scope);
    $scope.$digest();
    ctx.$element = jQuery(ctx.element);
    $elScope = ctx.element.isolateScope();
  };

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate('tabs', {
      'open-items': 'openItems'
    });
  });

  it('basic dom', function() {
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.instance'
        }
      });
    });
    injectSetupCompile();

    expect(ctx.$element).to.be.ok;
    expect(ctx.$element.children().hasClass('views-toolbar')).to.be.true;
  });

  it('basic scope', function() {
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
    });

    injectSetupCompile();
    expect($elScope).to.have.property('state');
    expect($elScope).to.have.deep.property('state.$current.name', 'instance.instance');
  });

});
