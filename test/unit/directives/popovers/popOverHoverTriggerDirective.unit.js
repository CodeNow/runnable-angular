'use strict';

// injector-provided
var $compile;
var $state;
var $document;
var $timeout;
var $scope;
var $elScope;
var $rootScope;
var element;

describe('popOverHoverTriggerDirective'.bold.underline.blue, function() {
  var ctx;

  describe('Functionality', function() {
    function initialize() {
      ctx = {};
      ctx.PopOverController = {
        closePopover: sinon.spy(function () {
          $elScope.active = false;
        }),
        openPopover: sinon.spy(function () {
          $elScope.active = true;
        }),
        isPopoverActive: sinon.stub().returns(false)
      };
      ctx.pointInPolygonMock = sinon.stub();
      angular.mock.module('app', function ($provide, $controllerProvider) {
        $controllerProvider.register('PopOverController', ctx.PopOverController);
        $provide.value('pointInPolygon',  ctx.pointInPolygonMock);
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
    }

    function createPopoverElement(position, elementLocation) {
      ctx.popoverElement = $compile('<div></div>')($scope);
      ctx.popoverElement.addClass(position);
      if (elementLocation) {
        sinon.stub(ctx.popoverElement[0], 'getBoundingClientRect').returns(elementLocation);
      }
      return ctx.popoverElement;
    }
    function injectSetupCompile(options) {
      initialize();

      ctx.template = directiveTemplate.attribute('pop-over-hover-trigger', options);
      element = angular.element(ctx.template);
      element.data('$popOverController', ctx.PopOverController);
      ctx.element = $compile(element)($scope);

      $elScope = ctx.element.scope();

      $scope.$digest();
    }
    describe('events', function () {
      beforeEach(function () {
        injectSetupCompile();
        ctx.PopOverController.popoverElement = createPopoverElement('top');
        sinon.spy(ctx.PopOverController.popoverElement, 'on');
        sinon.spy(ctx.PopOverController.popoverElement, 'off');

        sinon.spy($document, 'on');
        sinon.spy($document, 'off');

      });
      it('shouldnt open when the popover is already active', function () {
        $scope.$digest();
        ctx.PopOverController.isPopoverActive.returns(true);
        window.helpers.hover(ctx.element[0]);
        $scope.$digest();

        sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
        sinon.assert.notCalled(ctx.PopOverController.openPopover);
        sinon.assert.notCalled($document.on);
      });
      it('should open the popover on hover', function () {
        $scope.$digest();
        window.helpers.hover(ctx.element[0]);
        $scope.$digest();

        sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
        sinon.assert.calledOnce(ctx.PopOverController.openPopover);
        sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');

        window.helpers.mouseleave(ctx.element[0]);
        sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');
        sinon.assert.calledOnce($document.on);
        sinon.assert.calledWith($document.on, 'mousemove');
      });
      describe('mimicing activity', function () {
        it('should open popover, hover over it, then go away', function () {
          $scope.$digest();
          window.helpers.hover(ctx.element[0]);
          $scope.$digest();

          sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
          sinon.assert.calledOnce(ctx.PopOverController.openPopover);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');
          $scope.$digest();

          window.helpers.mouseleave(ctx.element[0]);
          $scope.$digest();
          sinon.assert.calledOnce($document.on);
          sinon.assert.calledWith($document.on, 'mousemove');

          var getPolygonMock = {};
          sinon.stub($elScope, 'getPolygon').returns(getPolygonMock);
          ctx.pointInPolygonMock.returns(true);
          $document.triggerHandler({
            type : 'mousemove',
            pageX: 48,
            pageY: 102
          });
          $scope.$digest();
          sinon.assert.calledOnce(ctx.pointInPolygonMock);
          sinon.assert.calledOnce($elScope.getPolygon);
          sinon.assert.calledWith(ctx.pointInPolygonMock, [48, 102], getPolygonMock);
          $scope.$digest();
          ctx.PopOverController.popoverElement.on.reset();
          ctx.PopOverController.popoverElement.triggerHandler({
            type : 'mouseenter',
            pageX: 48,
            pageY: 102
          });
          ctx.PopOverController.popoverElement.triggerHandler({
            type : 'mouseleave',
            pageX: 48,
            pageY: 102
          });

          sinon.assert.calledTwice(ctx.PopOverController.popoverElement.off);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseleave');
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseenter');
          sinon.assert.calledOnce(ctx.PopOverController.closePopover);
          sinon.assert.calledWith($document.off, 'mousemove');
        });
        it('should open popover, hover over it, then go away, then come back', function () {
          $scope.$digest();
          window.helpers.hover(ctx.element[0]);
          $scope.$digest();

          sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
          sinon.assert.calledOnce(ctx.PopOverController.openPopover);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');
          $scope.$digest();

          window.helpers.mouseleave(ctx.element[0]);
          $scope.$digest();
          sinon.assert.calledOnce($document.on);
          sinon.assert.calledWith($document.on, 'mousemove');


          var getPolygonMock = {};
          sinon.stub($elScope, 'getPolygon').returns(getPolygonMock);
          ctx.pointInPolygonMock.returns(true);
          $document.triggerHandler({
            type : 'mousemove',
            pageX: 48,
            pageY: 102
          });
          $scope.$digest();
          sinon.assert.calledOnce(ctx.pointInPolygonMock);
          sinon.assert.calledOnce($elScope.getPolygon);
          sinon.assert.calledWith(ctx.pointInPolygonMock, [48, 102], getPolygonMock);

          $scope.$digest();
          ctx.PopOverController.popoverElement.on.reset();
          ctx.PopOverController.popoverElement.triggerHandler({
            type : 'mouseenter',
            pageX: 48,
            pageY: 102
          });
          ctx.PopOverController.popoverElement.triggerHandler({
            type : 'mouseleave',
            pageX: 48,
            pageY: 102
          });

          sinon.assert.calledTwice(ctx.PopOverController.popoverElement.off);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseleave');
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseenter');
          sinon.assert.calledOnce(ctx.PopOverController.closePopover);
          sinon.assert.calledWith($document.off, 'mousemove');

          // reset the stubs
          ctx.PopOverController.popoverElement.off.reset();
          ctx.PopOverController.popoverElement.on.reset();
          $document.on.reset();
          $document.off.reset();
          ctx.PopOverController.isPopoverActive.reset();
          ctx.PopOverController.openPopover.reset();

          // Now go back
          window.helpers.hover(ctx.element[0]);
          $scope.$digest();

          sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
          sinon.assert.calledOnce(ctx.PopOverController.openPopover);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');
          $scope.$digest();
        });

        it('should open popover, but go outside permitted area and close', function () {
          $scope.$digest();
          window.helpers.hover(ctx.element[0]);
          $scope.$digest();

          sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
          sinon.assert.calledOnce(ctx.PopOverController.openPopover);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');

          window.helpers.mouseleave(ctx.element[0]);
          $scope.$digest();
          sinon.assert.calledOnce($document.on);
          sinon.assert.calledWith($document.on, 'mousemove');

          var getPolygonMock = {};
          sinon.stub($elScope, 'getPolygon').returns(getPolygonMock);
          ctx.pointInPolygonMock.returns(false);
          $document.triggerHandler({
            type : 'mousemove',
            pageX: 48,
            pageY: 102
          });

          $scope.$digest();
          sinon.assert.calledOnce(ctx.pointInPolygonMock);
          sinon.assert.calledOnce($elScope.getPolygon);
          sinon.assert.calledWith(ctx.pointInPolygonMock, [48, 102], getPolygonMock);

          sinon.assert.calledTwice(ctx.PopOverController.popoverElement.off);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseleave');
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseenter');
          sinon.assert.calledOnce(ctx.PopOverController.closePopover);
          sinon.assert.calledWith($document.off, 'mousemove');
        });

        it('should open popover, but go outside permitted area and close', function () {
          $scope.$digest();
          window.helpers.hover(ctx.element[0]);
          $scope.$digest();

          sinon.assert.calledOnce(ctx.PopOverController.isPopoverActive);
          sinon.assert.calledOnce(ctx.PopOverController.openPopover);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.on, 'mouseleave');

          window.helpers.mouseleave(ctx.element[0]);
          $scope.$digest();
          sinon.assert.calledOnce($document.on);
          sinon.assert.calledWith($document.on, 'mousemove');

          var getPolygonMock = {};
          sinon.stub($elScope, 'getPolygon').returns(getPolygonMock);
          ctx.pointInPolygonMock.returns(false);
          $document.triggerHandler({
            type : 'mousemove',
            pageX: 48,
            pageY: 102
          });

          $scope.$digest();
          sinon.assert.calledOnce(ctx.pointInPolygonMock);
          sinon.assert.calledOnce($elScope.getPolygon);

          sinon.assert.calledWith(ctx.pointInPolygonMock, [48, 102], getPolygonMock);

          sinon.assert.calledTwice(ctx.PopOverController.popoverElement.off);
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseleave');
          sinon.assert.calledWith(ctx.PopOverController.popoverElement.off, 'mouseenter');
          sinon.assert.calledOnce(ctx.PopOverController.closePopover);
          sinon.assert.calledWith($document.off, 'mousemove');
        });
      });
    });
    describe('cleanUp', function () {
      beforeEach(function () {
        injectSetupCompile();

        sinon.spy($document, 'on');
        sinon.spy($document, 'off');

      });
      it('shouldnt clean up successfully even if the popoverElement never existed', function () {
        $scope.$digest();
        $elScope.$destroy();
        sinon.assert.calledOnce(ctx.PopOverController.closePopover);
        sinon.assert.calledWith($document.off, 'mousemove');
        $scope.$digest();
        window.helpers.hover(ctx.element[0]);
        $scope.$digest();

        sinon.assert.notCalled(ctx.PopOverController.isPopoverActive);
        sinon.assert.notCalled(ctx.PopOverController.openPopover);
      });
    });
    describe('getPolygon', function () {
      it('top', function () {
        injectSetupCompile();

        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          left:   50,
          right:  60,
          top:    100,
          bottom: 120
        });
        ctx.PopOverController.popoverElement = createPopoverElement('top', {
          left:   20,
          right:  90,
          top:    40,
          bottom: 80
        });
        //    _________
        // __|_________|__
        // \ |_popover_| /
        //  \___________/
        //   |__button_|

        var boundary = $elScope.getPolygon();
        expect(boundary[0], 'element bottomLeft').to.deep.equal([50, 120]);
        expect(boundary[1], 'element bottomRight').to.deep.equal([60, 120]);
        expect(boundary[2], 'popoverRect bottomLeft').to.deep.equal([10, 70]);
        expect(boundary[3], 'popoverRect bottomRight').to.deep.equal([100, 70]);
      });
      it('bottom (with double the tolerance)', function () {
        injectSetupCompile({
          'pop-over-hover-tolerance': '20'
        });

        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          left:   50,
          right:  60,
          top:    100,
          bottom: 120
        });
        ctx.PopOverController.popoverElement = createPopoverElement('bottom', {
          left:   20,
          right:  90,
          top:    160,
          bottom: 200
        });

        //    _________
        //   |__button_|
        //  / _________ \
        // /_|_________|_\
        //   |_popover_|


        var boundary = $elScope.getPolygon();
        expect(boundary[0], 'element topLeft').to.deep.equal([50, 100]);
        expect(boundary[1], 'element topRight').to.deep.equal([60, 100]);
        expect(boundary[2], 'popoverRect topLeft').to.deep.equal([0, 180]);
        expect(boundary[3], 'popoverRect topRight').to.deep.equal([110, 180]);
      });
      it('left', function () {
        injectSetupCompile();
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          left:   50,
          right:  60,
          top:    100,
          bottom: 120
        });
        ctx.PopOverController.popoverElement = createPopoverElement('left', {
          left:   0,
          right:  20,
          top:    80,
          bottom: 140
        });
        //
        //     |\
        //  ___|_ \
        // |   | |  \ _________
        // | po| |   |__button_|
        // |__ |_|  /
        //     |  /
        //     |/
        var boundary = $elScope.getPolygon();
        expect(boundary[0], 'element topRight').to.deep.equal([60, 100]);
        expect(boundary[1], 'element bottomRight').to.deep.equal([60, 120]);
        expect(boundary[2], 'popoverRect topRight').to.deep.equal([10, 70]);
        expect(boundary[3], 'popoverRect bottomRight').to.deep.equal([10, 150]);
      });
      it('right', function () {
        injectSetupCompile();
        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          left:   50,
          right:  60,
          top:    100,
          bottom: 120
        });
        ctx.PopOverController.popoverElement = createPopoverElement('right', {
          left:   80,
          right:  120,
          top:    80,
          bottom: 140
        });
        //                 /|
        //               / _|____
        //    _________ / | |    |
        //   |__button_|  | | po |
        //              \ |_|____|
        //               \  |
        //                 \|

        var boundary = $elScope.getPolygon();
        expect(boundary[0], 'element topLeft').to.deep.equal([50, 100]);
        expect(boundary[1], 'element bottomLeft').to.deep.equal([50, 120]);
        expect(boundary[2], 'popoverRect topLeft').to.deep.equal([90, 70]);
        expect(boundary[3], 'popoverRect bottomLeft').to.deep.equal([90, 150]);
      });
      it('top (with 0 tolerance', function () {
        injectSetupCompile({
          'pop-over-hover-tolerance': '0'
        });

        sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
          left:   50,
          right:  60,
          top:    100,
          bottom: 120
        });
        ctx.PopOverController.popoverElement = createPopoverElement('top', {
          left:   20,
          right:  90,
          top:    40,
          bottom: 80
        });
        //    _________
        // __|_________|__
        // \ |_popover_| /
        //  \___________/
        //   |__button_|

        var boundary = $elScope.getPolygon();
        expect(boundary[0], 'element bottomLeft').to.deep.equal([50, 120]);
        expect(boundary[1], 'element bottomRight').to.deep.equal([60, 120]);
        expect(boundary[2], 'popoverRect bottomLeft').to.deep.equal([20, 80]);
        expect(boundary[3], 'popoverRect bottomRight').to.deep.equal([90, 80]);
      });
    });
  });
});