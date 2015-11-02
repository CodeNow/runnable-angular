'use strict';

// injector-provided
var $compile;
var $state;
var $document;
var $timeout;
var $scope;
var $elScope;
var $rootScope;

describe('directivePopOver'.bold.underline.blue, function() {
  var ctx;

  describe('Functionality', function() {
    var popoverOptions;

    function initialize() {
      ctx = {};
      ctx.PopOverController  = function () {
        ctx.POC = this;
        this.closePopover = sinon.spy(function () {
          $elScope.active = false;
        });
        this.openPopover = sinon.spy(function () {
          $elScope.active = true;
        });
        this.popoverElement = [{}];
        this.popoverElementScope = {};
      };
      ctx.mockument = {
        find: sinon.spy(function (value) {
          return [ctx.mockument[value]];
        }),
        body: {
          offsetHeight: 10,
          offsetWidth: 10,
          scrollTop: 10
        },
        html: {
          clientWidth: 10,
          offsetHeight: 10,
          scrollTop: 10
        }
      };
      ctx.mockLog = {
        error: sinon.spy()
      };
      angular.mock.module('app', function ($provide, $controllerProvider) {
        $provide.value('$document', ctx.mockument);
        $provide.value('$log', ctx.mockLog);
        $controllerProvider.register('PopOverController', ctx.PopOverController);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$compile_,
        _$document_,
        _$timeout_
      ) {
        $scope = _$rootScope_.$new();
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $document = _$document_;
        $timeout = _$timeout_;
      });

      sinon.spy($rootScope, '$broadcast');
      $rootScope.$broadcast.reset();
    }
    function injectSetupCompile (options, controller, controllerAs) {
      initialize();

      $scope.$destroy = sinon.spy();

      $scope.popOverData = {
        content: 'foo'
      };
      $scope.popOverActions = {
        action1: sinon.spy()
      };
      $scope.popOverActive = false;
      $scope.popOverOptions = {};
      if (options.popOverOptions) {
        $scope.popOverOptions = options.popOverOptions;
      }
      $scope.popOverController = controller;

      popoverOptions = {
        'pop-over-data': 'popOverData',
        'pop-over-no-broadcast': options.noBroadcast || false,
        'pop-over-actions':  'popOverActions',
        'pop-over-active': 'popOverActive',
        'pop-over-template': 'viewPopoverFileExplorerFileMenu',
        'pop-over-options': 'popOverOptions'
      };
      if (controller) {
        popoverOptions['pop-over-controller'] = 'popOverController';
      }
      if (controllerAs) {
        popoverOptions['pop-over-controller-as'] = controllerAs;
      }

      if (options.rightClick) {
        popoverOptions['pop-over-trigger'] = 'rightClick';
      } else if (options.hover) {
        popoverOptions['pop-over-trigger'] = 'hover';
      } else if (options.activeAttr) {
        popoverOptions['pop-over-trigger'] = 'activeAttr';
      }

      ctx.template = directiveTemplate.attribute('pop-over', popoverOptions);
      ctx.element = $compile(ctx.template)($scope);
      $elScope = ctx.element.isolateScope();

      $scope.$digest();

      if (options.rightClick) {
        window.helpers.rightClick(ctx.element[0]);
      } else if (options.hover) {
        window.helpers.hover(ctx.element[0]);
      } else {
        window.helpers.click(ctx.element[0]);
      }

      // We need to digest because this is a user event, a click happened which triggers
      //    a digest internally. It doesn't when we are in tests!
      $scope.$digest();

      //Flush timeouts so we actually set popOverActive
      $timeout.flush(0);
    }
    describe('initialization errors', function () {
      it('should error when a controllerAs doesnt exist', function () {
        function startup() {
          initialize();

          $scope.popOverController = {};
          popoverOptions = {
            'pop-over-data': 'popOverData',
            'pop-over-no-broadcast': false,
            'pop-over-actions':  'popOverActions',
            'pop-over-active': 'popOverActive',
            'pop-over-template': 'viewPopoverFileExplorerFileMenu',
            'pop-over-options': 'popOverOptions',
            'pop-over-controller': 'popOverController',
            'pop-over-controller-as' : 'controller'
          };

          ctx.template = directiveTemplate.attribute('pop-over', popoverOptions);
          ctx.element = $compile(ctx.template)($scope);
          $elScope = ctx.element.isolateScope();

          $scope.$digest();
        }
        expect(startup).to.throw('Tried to initialize a popover with a name which would override isolated scope variable');
      });
      it('should error without a template', function () {
        initialize();

        popoverOptions = {
          'pop-over-data': 'popOverData',
          'pop-over-no-broadcast': false,
          'pop-over-actions':  'popOverActions',
          'pop-over-active': 'popOverActive',
          'pop-over-options': 'popOverOptions'
        };

        ctx.template = directiveTemplate.attribute('pop-over', popoverOptions);
        ctx.element = $compile(ctx.template)($scope);
        $elScope = ctx.element.isolateScope();

        $scope.$digest();

        sinon.assert.calledWith(ctx.mockLog.error, 'Pop over needs a template');

      });
    });

    describe('controller', function () {
      it('should put the controller on the scope', function () {
        var mockScopeController = {
          hello: 'cheese'
        };
        injectSetupCompile({}, mockScopeController);
        expect($elScope.controller, 'controller').to.equal(mockScopeController);
      });
      it('should put the controller on the scope with the name we select', function () {
        var mockScopeController = {
          hello: 'cheese'
        };
        injectSetupCompile({}, mockScopeController, 'hello');
        expect($elScope.hello, 'controller').to.equal(mockScopeController);
      });
    });

    describe('left click', function () {
      beforeEach(function () {
        injectSetupCompile({});
      });

      it('should open when clicked', function() {
        sinon.assert.calledOnce($elScope.POC.openPopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should close when clicked again', function() {
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should remove watchers on destroy of the scope', function() {
        ctx.element.off = sinon.spy();
        $elScope.$destroy();
        expect(ctx.element.off.calledWith('click'), 'unbound click handler').to.equal(false);
      });

      it('should do nothing if the element that was clicked is disabled', function() {
        ctx.element.prop('disabled', true);
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        sinon.assert.notCalled($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });
    });
    //
    //describe('hover', function () {
    //  beforeEach(function () {
    //    injectSetupCompile({
    //      hover: true
    //    });
    //  });
    //
    //  it('should open when hovered', function() {
    //    sinon.assert.calledOnce($elScope.POC.openPopover);
    //    expect($scope.popOverActive, 'pop over is active').to.equal(true);
    //  });
    //
    //  it('should do nothing if the element that was clicked is disabled', function() {
    //    ctx.element.prop('disabled', true);
    //    $elScope.POC.openPopover.reset();
    //    window.helpers.hover(ctx.element[0]);
    //    $scope.$digest();
    //    sinon.assert.notCalled($elScope.POC.openPopover);
    //    expect($scope.popOverActive, 'pop over is active').to.equal(true);
    //  });
    //
    //  it('should remove watchers on destroy of the scope', function() {
    //    ctx.element.off = sinon.spy();
    //    $elScope.$destroy();
    //    expect(ctx.element.off.calledWith('mouseover'), 'unbound click handler').to.equal(false);
    //  });
    //});


    describe('right click', function () {
      beforeEach(function () {
        injectSetupCompile({
          rightClick: true
        });
      });

      it('should open when clicked', function() {
        sinon.assert.calledOnce($elScope.POC.openPopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should do nothing if the element that was clicked is disabled', function() {
        ctx.element.prop('disabled', true);
        window.helpers.rightClick(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.openPopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should close when clicked again', function() {
        window.helpers.rightClick(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should remove watchers on destroy of the scope', function() {
        ctx.element.off = sinon.spy();
        $elScope.$destroy();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect(ctx.element.off.calledWith('contextmenu'), 'unbound click handler').to.equal(false);
      });
    });


    describe('activeAttr', function () {
      beforeEach(function () {
        injectSetupCompile({
          activeAttr: true
        });
      });

      it('should open when attr changes', function() {
        $elScope.active = true;
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.openPopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should close when attr is flipped', function() {
        $elScope.POC.closePopover.reset(); // it was called at the beginning, when $scope.$watch('active' ran the first time
        $elScope.active = true;
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.openPopover);
        $elScope.active = false;
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
        $elScope.$destroy();
      });
    });

    describe('edge cases', function(){
      it('should handle when there is a top attribute set', function(){
        injectSetupCompile({
          popOverOptions: {
            top: 10
          }
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });
      it('should handle when there is a left attribute set', function(){
        injectSetupCompile({
          popOverOptions: {
            left: 10
          }
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });
      it('should not broadcast when the popover is opened if noBroadcast is set', function(){
        injectSetupCompile({
          noBroadcast: true
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($rootScope.$broadcast.calledWith('app-document-click'), 'broadcast called').to.equal(false);
      });
      it('should broadcast when the popover is opened if noBroadcast is false', function(){
        injectSetupCompile({
          noBroadcast: false
        });
        expect($rootScope.$broadcast.calledWith('app-document-click'), 'broadcast called').to.equal(true);
      });
      it('should handle when mouse is set to true', function(){
        injectSetupCompile({
          popOverOptions: {
            mouse: true
          }
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        sinon.assert.calledOnce($elScope.POC.closePopover);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });
    });

    describe('popoverStyle', function () {
      it('just a regular style', function () {
        injectSetupCompile({
          popOverOptions: {
            top: 100,
            left: 10
          }
        });
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          top: 20,
          bottom: 40,
          right: 20,
          left: 40
        });
        ctx.POC.popoverElement[0].offsetWidth = 10;
        ctx.POC.popoverElement[0].offsetHeight = 10;
        $elScope.active = true;
        $scope.$digest();
        var styleResult = $elScope.popoverStyle.getStyle();

        expect(styleResult.top, 'styleResult.top').to.equal('130px'); // 100 + 20 + 10
        expect(styleResult.left, 'styleResult.left').to.equal('50px'); // 10 + 40
        expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        expect(styleResult.right, 'styleResult.right').to.equal('auto');

        $elScope.active = false;
        ctx.POC.popoverElement[0].offsetWidth = 40;
        ctx.POC.popoverElement[0].offsetHeight = 40;
        $scope.$digest();

        // Since the popover is no longer active, it will just use the previousStyle
        styleResult = $elScope.popoverStyle.getStyle();
        expect(styleResult.top, 'styleResult.top').to.equal('130px'); // 100 + 20 + 10
        expect(styleResult.left, 'styleResult.left').to.equal('50px'); // 10 + 40
        expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        expect(styleResult.right, 'styleResult.right').to.equal('auto');

      });
      it('mouse', function () {
        injectSetupCompile({
          popOverOptions: {
            mouse: true,
            top: 100,
            left: 10
          }
        });
        $elScope.options = {
          mouse: {
            left: 90,
            right: 90,
            top: 90,
            bottom: 90
          }
        };
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          top: 20,
          bottom: 40,
          right: 20,
          left: 40
        });
        ctx.POC.popoverElement[0].offsetWidth = 10;
        ctx.POC.popoverElement[0].offsetHeight = 10;
        $elScope.active = true;
        $scope.$digest();
        var styleResult = $elScope.popoverStyle.getStyle();

        expect(styleResult.top, 'styleResult.top').to.equal('180px'); // -10 + 90 + 100
        expect(styleResult.left, 'styleResult.left').to.equal('100px'); // 10 + 90
        expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        expect(styleResult.right, 'styleResult.right').to.equal('auto');
      });
      it('pinToViewport', function () {
        injectSetupCompile({
          popOverOptions: {
            pinToViewPort: true,
            top: 100,
            left: 10
          }
        });
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          top: 20,
          bottom: 40,
          right: 20,
          left: 40
        });
        ctx.POC.popoverElement[0].offsetWidth = 10;
        ctx.POC.popoverElement[0].offsetHeight = 10;
        $elScope.active = true;
        $scope.$digest();
        var styleResult = $elScope.popoverStyle.getStyle();

        expect(styleResult.top, 'styleResult.top').to.equal('100px'); // 100 + (10 - 10)
        expect(styleResult.left, 'styleResult.left').to.equal('50px'); // 10 + 40
        expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        expect(styleResult.right, 'styleResult.right').to.equal('auto');
      });
      it('centered', function () {
        injectSetupCompile({
          popOverOptions: {
            centered: true,
            bottom: 100,
            right: 50
          }
        });
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          top: 20,
          bottom: 40,
          right: 20,
          left: 40
        });
        ctx.POC.popoverElement[0].offsetWidth = 10;
        ctx.POC.popoverElement[0].offsetHeight = 10;
        $elScope.active = true;
        $scope.$digest();
        var styleResult = $elScope.popoverStyle.getStyle();

        expect(styleResult.top, 'styleResult.top').to.equal('auto');
        expect(styleResult.left, 'styleResult.left').to.equal('25px'); // -10/2 + 40 + (20 - 40)/2
        expect(styleResult.bottom, 'styleResult.bottom').to.equal('150px'); // 100 + 40 + 10
        expect(styleResult.right, 'styleResult.right').to.be.null;
      });
      it('verticallyCentered', function () {
        injectSetupCompile({
          popOverOptions: {
            verticallyCentered: true,
            bottom: 100,
            left: 40
          }
        });
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          top: 20,
          bottom: 40,
          right: 20,
          left: 40
        });
        ctx.POC.popoverElement[0].offsetWidth = 10;
        ctx.POC.popoverElement[0].offsetHeight = 10;
        $elScope.active = true;
        $scope.$digest();
        var styleResult = $elScope.popoverStyle.getStyle();

        expect(styleResult.top, 'styleResult.top').to.equal('25px'); // -10/2 + 20 + (40 - 20)/2
        expect(styleResult.left, 'styleResult.left').to.equal('80px'); // 40 + 40
        expect(styleResult.bottom, 'styleResult.bottom').to.be.null;
        expect(styleResult.right, 'styleResult.right').to.equal('auto');
      });
    });
  });
});