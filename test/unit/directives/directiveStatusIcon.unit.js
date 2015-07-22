'use strict';

describe('directiveStatusIcon'.bold.underline.blue, function() {
  var $compile;
  var $scope;
  var $elScope;
  var ctx;
  var $rootScope;
  var getInstanceClassesSpy;
  var instanceClasses;
  var $browser;
  function setup(instance) {
    angular.mock.module('app');
    instanceClasses = {
      green: true
    };


    angular.mock.module(function ($provide) {
      $provide.factory('getInstanceClasses', function () {
        getInstanceClassesSpy = sinon.stub().returns(instanceClasses);
        return getInstanceClassesSpy;
      });
    });


    ctx = {};
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$browser_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $browser = _$browser_;
    });

    ctx.instance = instance || {
      on: sinon.spy(),
      off: sinon.spy()
    };

    $scope.instance = ctx.instance;
    ctx.template = directiveTemplate('status-icon', {
      'instance': 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('default setup', function () {
    beforeEach(function () {
      setup();
    });

    it('should listen to instance update events', function () {
      sinon.assert.calledOnce(ctx.instance.on);
      expect($elScope.instanceClasses).to.equal(instanceClasses);
      sinon.assert.calledOnce(getInstanceClassesSpy);
      var updateCb = ctx.instance.on.lastCall.args[1];
      updateCb();
      sinon.assert.calledOnce(getInstanceClassesSpy);
      $browser.defer.flush(); // The updateCB should trigger a digest, this makes sure that finishes
      sinon.assert.calledTwice(getInstanceClassesSpy);
    });

    it('should unlisten on scope destroy', function () {
      $elScope.$emit('$destroy');
      var updateCb = ctx.instance.on.lastCall.args[1];
      sinon.assert.calledOnce(ctx.instance.off);
      sinon.assert.calledWith(ctx.instance.off, 'update', updateCb);
    });
  });

  it('should handle when there is no on method on the instance', function () {
    setup({});
    expect($elScope.instanceClasses).to.equal(instanceClasses);
  });

  it('should handle when there is no off method on the instance', function () {
    setup({ on: sinon.spy() });
    expect($elScope.instanceClasses).to.equal(instanceClasses);
    sinon.assert.calledOnce(ctx.instance.on);
    $elScope.$emit('$destroy');
  });




});
