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

    function injectSetupCompile (options) {
      ctx = {};
      angular.mock.module('app');
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

      popoverOptions = {
        'pop-over-data': 'popOverData',
        'pop-over-no-broadcast': options.noBroadcast || false,
        'pop-over-actions':  'popOverActions',
        'pop-over-active': 'popOverActive',
        'pop-over-template': 'viewPopoverFileExplorerFileMenu',
        'pop-over-options': 'popOverOptions'
      };

      if (options.rightClick) {
        popoverOptions['pop-over-trigger'] = 'rightClick';
      }

      ctx.template = directiveTemplate.attribute('pop-over', popoverOptions);
      ctx.element = $compile(ctx.template)($scope);
      $elScope = ctx.element.isolateScope();

      $scope.$digest();

      if (options.rightClick) {
        window.helpers.rightClick(ctx.element[0]);
      } else {
        window.helpers.click(ctx.element[0]);
      }

      // We need to digest because this is a user event, a click happened which triggers
      //    a digest internally. It doesn't when we are in tests!
      $scope.$digest();

      //Flush timeouts so we actually set popOverActive
      $timeout.flush(0);
    }

    describe('left click', function () {
      beforeEach(function () {
        injectSetupCompile({});
      });

      it('should open when clicked', function() {
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should close when clicked again', function() {
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should destroy the child scope that was created when the element is destroyed', function() {
        $elScope.popoverElementScope.$destroy = sinon.spy();
        $elScope.popoverElement.remove = sinon.spy();
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
        $timeout.flush(500);
        expect($elScope.popoverElementScope.$destroy.calledOnce, 'destroyed popoverElementScope').to.equal(true);
        expect($elScope.popoverElement.remove.calledOnce, 'removed element from the page').to.equal(true);
      });

      it('should close when the close-popovers event is broadcasted', function () {
        $elScope.$broadcast('close-popovers');
        $timeout.flush(0);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should close when the app-document-click event is broadcasted', function () {
        $elScope.$broadcast('app-document-click');
        $timeout.flush(0);
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should close when scope.closePopover method is called', function () {
        $elScope.closePopover();
        $timeout.flush(0);
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
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });
    });

    describe('right click', function () {
      beforeEach(function () {
        injectSetupCompile({
          rightClick: true
        });
      });

      it('should open when clicked', function() {
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should do nothing if the element that was clicked is disabled', function() {
        ctx.element.prop('disabled', true);
        window.helpers.rightClick(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(true);
      });

      it('should close when clicked again', function() {
        window.helpers.rightClick(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });

      it('should remove watchers on destroy of the scope', function() {
        ctx.element.off = sinon.spy();
        $elScope.$destroy();
        expect(ctx.element.off.calledWith('contextmenu'), 'unbound click handler').to.equal(false);
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
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });
      it('should not broadcast when the popover is opened if noBroadcast is set', function(){
        injectSetupCompile({
          noBroadcast: true
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        expect($rootScope.$broadcast.calledWith('pp-document-click'), 'broadcast called').to.equal(false);
      });
      it('should broadcast when the popover is opened if noBroadcast is false', function(){
        injectSetupCompile({
          noBroadcast: false
        });
        expect($rootScope.$broadcast.calledWith('pp-document-click'), 'broadcast called').to.equal(false);
      });
      it('should handle when mouse is set to true', function(){
        injectSetupCompile({
          popOverOptions: {
            mouse: true
          }
        });
        window.helpers.click(ctx.element[0]);
        $scope.$digest();
        expect($scope.popOverActive, 'pop over is active').to.equal(false);
      });
    });
  });
});