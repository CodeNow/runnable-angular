'use strict';

// injector-provided
var $compile;
var $state;
var $document;
var $timeout;
var $scope;
var $elScope;
var $rootScope;

describe('popOverHoverTriggerDirective'.bold.underline.blue, function() {
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
      ctx.mockLog = {
        error: sinon.spy()
      };
      angular.mock.module('app', function ($provide, $controllerProvider) {
        $controllerProvider.register('PopOverController', ctx.PopOverController);
        $provide.value('$log', ctx.mockLog);
        $provide.factory('popOverDirective', function () {
          return {
            priority: 100000,
            terminal: true,
            controller: ctx.PopOverController,
            link: angular.noop
          };
        });
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
    function injectSetupCompile (options) {
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

      popoverOptions = {
        'pop-over-no-broadcast': options.noBroadcast || false,
        'pop-over-actions':  'popOverActions',
        'pop-over-active': 'popOverActive',
        'pop-over-template': 'viewPopoverFileExplorerFileMenu',
        'pop-over-options': 'popOverOptions'
      };

      if (options.rightClick) {
        popoverOptions['pop-over-trigger'] = 'rightClick';
      } else if (options.hover) {
        popoverOptions['pop-over-trigger'] = 'hover';
      } else if (options.activeAttr) {
        popoverOptions['pop-over-trigger'] = 'activeAttr';
      }

      ctx.template = directiveTemplate.attributeWithParent('pop-over-hover-trigger', 'pop-over', popoverOptions);
      ctx.element = $compile(ctx.template)($scope);
      $elScope = ctx.element.isolateScope();

      $scope.$digest();

      // We need to digest because this is a user event, a click happened which triggers
      //    a digest internally. It doesn't when we are in tests!
      $scope.$digest();

      //Flush timeouts so we actually set popOverActive
      $timeout.flush(0);
    }

    describe('popoverStyle', function () {
      it('just a regular style', function () {
        injectSetupCompile({
          popOverOptions: {
            top: 100,
            left: 10
          }
        });
        //sinon.stub(ctx.element[0], 'getBoundingClientRect').returns({
        //  top: 20,
        //  bottom: 40,
        //  right: 20,
        //  left: 40
        //});
        //ctx.POC.popoverElement[0].offsetWidth = 10;
        //ctx.POC.popoverElement[0].offsetHeight = 10;
        //$elScope.active = true;
        //$scope.$digest();
        //var styleResult = $elScope.popoverStyle.getStyle();
        //
        //expect(styleResult.top, 'styleResult.top').to.equal('130px'); // 100 + 20 + 10
        //expect(styleResult.left, 'styleResult.left').to.equal('50px'); // 10 + 40
        //expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        //expect(styleResult.right, 'styleResult.right').to.equal('auto');
        //
        //$elScope.active = false;
        //ctx.POC.popoverElement[0].offsetWidth = 40;
        //ctx.POC.popoverElement[0].offsetHeight = 40;
        //$scope.$digest();
        //
        //// Since the popover is no longer active, it will just use the previousStyle
        //styleResult = $elScope.popoverStyle.getStyle();
        //expect(styleResult.top, 'styleResult.top').to.equal('130px'); // 100 + 20 + 10
        //expect(styleResult.left, 'styleResult.left').to.equal('50px'); // 10 + 40
        //expect(styleResult.bottom, 'styleResult.bottom').to.equal('auto');
        //expect(styleResult.right, 'styleResult.right').to.equal('auto');

      });
    });
  });
});