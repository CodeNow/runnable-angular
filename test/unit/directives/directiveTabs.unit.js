'use strict';

var jQuery  = require('jquery');

// injector-provided
var $compile,
    $provide,
    $scope,
    $state,
    user;
var $elScope;

describe.skip('directiveTabs'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$state_
    ) {
      $compile = _$compile_;
      $state = _$state_;
      $scope = _$rootScope_.$new();
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
    });

    injectSetupCompile();
    expect($elScope).to.have.property('state');
    expect($elScope).to.have.deep.property('state.$current.name', 'instance.instance');
  });

});
