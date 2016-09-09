'use strict';

// injector-provided
var $compile;
var $state;
var $document;
var $timeout;
var $scope;
var $elScope;
var $controller;
var $rootScope;
var $templateCache;

describe('PopOverController'.bold.underline.blue, function() {
  var ctx;
  var POC;

  describe('Functionality', function() {
    function injectSetupCompile (options) {
      ctx = {};
      ctx.mockument = {
        find: sinon.spy(function (value) {
          return ctx.mockument[value];
        }),
        body: {
          append: sinon.spy()
        },
        0: {
          contains: sinon.spy(function () {
            return true;
          })
        }
      };
      angular.mock.module('app', function ($provide) {
        $provide.value('$document', ctx.mockument);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$compile_,
        _$document_,
        _$timeout_,
        _$controller_,
        _$templateCache_
      ) {
        $scope = _$rootScope_.$new();
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $document = _$document_;
        $timeout = _$timeout_;
        $controller = _$controller_;
        $templateCache = _$templateCache_;
      });
      sinon.spy($rootScope, '$broadcast');
      $rootScope.$broadcast.reset();

      $scope.$destroy = sinon.spy();

      $scope.popOverData = {
        content: 'foo'
      };
      $scope.popOverActions = {
        action1: sinon.spy()
      };
      $scope.popOverActive = false;
      $scope.popoverOptions = {};
      if (options.popoverOptions) {
        $scope.popoverOptions = options.popoverOptions;
      }
      $scope.template = 'template';
      var laterController = $controller('PopOverController', {
        $scope: $scope
      }, true);
      POC = laterController();

      $scope.$digest();

      //Flush timeouts so we actually set popOverActive
      $timeout.flush(0);
    }

    describe('openPopover', function () {

      it('should open normally', function () {
        injectSetupCompile({});
        sinon.stub($templateCache, 'get').returns({});
        POC.openPopover();
        expect($scope.popoverOptions.top, 'popoverOptions.top').to.equal(0);
        expect($scope.popoverOptions.left, 'popoverOptions.left').to.equal(0);
        sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.deep.equal(angular.noop);
        expect(POC.unbindPopoverOpened, 'unbindPopoverOpened').to.be.function;

        expect(POC.popoverElementScope, 'popoverElementScope').to.be.ok;
        expect(POC.popoverElement, 'popoverElement').to.be.ok;

        sinon.assert.calledWith(ctx.mockument.body.append, POC.popoverElement);
        expect($scope.active, 'active').to.be.true;
        $timeout.flush(0);
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.be.function;
      });

      it('should take in the popoverOptions from the scope', function () {
        injectSetupCompile({
          popoverOptions: {
            top: 10,
            right: 20
          }
        });
        sinon.stub($templateCache, 'get').returns({});
        POC.openPopover();
        expect($scope.popoverOptions.top, 'popoverOptions.top').to.equal(10);
        expect($scope.popoverOptions.right, 'popoverOptions.left').to.equal(20);
        sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.deep.equal(angular.noop);
        expect(POC.unbindPopoverOpened, 'unbindPopoverOpened').to.be.function;

        expect(POC.popoverElementScope, 'popoverElementScope').to.be.ok;
        expect(POC.popoverElement, 'popoverElement').to.be.ok;

        sinon.assert.calledWith(ctx.mockument.body.append, POC.popoverElement);
        expect($scope.active, 'active').to.be.true;
        $timeout.flush(500);
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.be.function;
      });

      it('should throw error when no template exists', function () {
        injectSetupCompile({});

        sinon.stub($templateCache, 'get').returns(null);
        expect(POC.openPopover, 'openPopover').to.throw('Popover template not found: ' + $scope.template);
      });
    });



    describe('closePopover', function () {

      it('should destroy the child scope that was created when the element is destroyed', function() {
        injectSetupCompile({});
        sinon.stub($templateCache, 'get').returns({});
        $scope.active = true;
        POC.popoverElementScope = {};
        POC.popoverElement = {};
        POC.unbindDocumentClick = sinon.spy();
        POC.unbindPopoverOpened = sinon.spy();
        POC.unbindSpecificPopoverOpened = sinon.spy();
        POC.popoverElementScope.$destroy = sinon.spy();
        POC.popoverElement.remove = sinon.spy();
        POC.closePopover();
        $scope.$digest();
        expect($scope.active, 'pop over is active').to.equal(false);
        $timeout.flush(500);
        expect(POC.popoverElementScope.$destroy.calledOnce, 'destroyed popoverElementScope').to.equal(true);
        expect(POC.popoverElement.remove.calledOnce, 'removed element from the page').to.equal(true);
        sinon.assert.calledOnce(POC.unbindDocumentClick);
        sinon.assert.calledOnce(POC.unbindPopoverOpened);
      });
    });
    describe('testing unbindings', function () {
      beforeEach(function () {
        injectSetupCompile({});
        sinon.stub($templateCache, 'get').returns({});
        POC.openPopover();
        expect($scope.popoverOptions.top, 'popoverOptions.top').to.equal(0);
        expect($scope.popoverOptions.left, 'popoverOptions.left').to.equal(0);
        sinon.assert.calledWith($rootScope.$broadcast, 'close-popovers');
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.deep.equal(angular.noop);
        expect(POC.unbindPopoverOpened, 'unbindPopoverOpened').to.be.function;

        expect(POC.popoverElementScope, 'popoverElementScope').to.be.ok;
        expect(POC.popoverElement, 'popoverElement').to.be.ok;

        sinon.assert.calledWith(ctx.mockument.body.append, POC.popoverElement);
        expect($scope.active, 'active').to.be.true;
        $timeout.flush(0);
        expect(POC.unbindDocumentClick, 'unbindDocumentClick').to.be.function;

        sinon.stub(POC, 'closePopover');
      });
      it('should listen to the app-document-click', function () {
        POC.popoverElement[0] = {
          contains: sinon.spy(function () {
            return false;
          })
        };
        $rootScope.$broadcast('app-document-click', {}, {});
        $scope.$digest();

        sinon.assert.calledOnce(POC.closePopover);
      });
      it('should listen to the close-popovers', function () {
        POC.popoverElement[0] = {
          contains: sinon.spy(function () {
            return true;
          })
        };
        $rootScope.$broadcast('close-popovers', {}, {});
        $scope.$digest();

        sinon.assert.calledOnce(POC.closePopover);
      });
      it('should not close if it is an uncloseable popover', function () {
        POC.popoverElement[0] = {
          contains: sinon.spy(function () {
            return true;
          })
        };
        $scope.userCannotClose = true;
        $rootScope.$broadcast('close-popovers', false, {});
        $scope.$digest();
        sinon.assert.notCalled(POC.closePopover);

        $rootScope.$broadcast('close-popovers', true, {});
        $scope.$digest();
        sinon.assert.calledOnce(POC.closePopover);
      });
      it('should close an uncloseable popover if the close specific popover is broadcast', function () {
        POC.popoverElement[0] = {
          contains: sinon.spy(function () {
            return true;
          })
        };
        $scope.data = {popoverName: 'mockPopoverName'};
        $scope.userCannotClose = true;

        $rootScope.$broadcast('close-open-state-popover', 'not the correct name', {});
        $scope.$digest();
        sinon.assert.notCalled(POC.closePopover);

        $rootScope.$broadcast('close-open-state-popover', 'mockPopoverName', {});
        $scope.$digest();
        sinon.assert.calledOnce(POC.closePopover);
      });
    });
  });
});
