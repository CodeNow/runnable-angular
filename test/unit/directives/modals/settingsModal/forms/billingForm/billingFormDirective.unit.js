/*global directiveTemplate:true */
'use strict';
var $scope;
var element;

describe('billingFormDirective'.bold.underline.blue, function () {
  var broadcastStub;
  var mockCurrentOrg;
  beforeEach(function () {
    broadcastStub = sinon.stub();
    window.helpers.killDirective('billingHistoryForm');
    window.helpers.killDirective('changePaymentForm');
    window.helpers.killDirective('paymentSummary'); // Included from confirmationForm
    window.helpers.killDirective('planStatusForm');
    window.helpers.killDirective('planSummary');
    window.helpers.killDirective('showPaymentForm');
    mockCurrentOrg = {
      poppa: {
        isInTrial: sinon.stub().returns(true),
        attrs: {
          hasPaymentMethod: false
        }
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope
    ) {
      $scope = $rootScope.$new();
      $scope.SEMC = {
        showFooter: false
      };
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('billing-form');
      element = $compile(tpl)($scope);
      $scope.$digest();
      $scope.$broadcast = broadcastStub;
      element.isolateScope();
    });
  });

  it('should set current org on local scope', function () {
    expect($scope.currentOrg).to.equal(mockCurrentOrg);
  });

  describe('on animated panel change', function () {
    it('should set footer if panel is billingForm', function () {
      $scope.SEMC.showFooter = false;
      $scope.$emit('changed-animated-panel', 'billingForm');
      $scope.$digest();
      expect($scope.SEMC.showFooter).to.equal(true);
    });
    it('should unset footer if panel is billingForm', function () {
      $scope.$emit('changed-animated-panel', 'changePaymentForm');
      $scope.$digest();
      expect($scope.SEMC.showFooter).to.equal(false);
    });
  });

  it('should set the footer to true when the scope gets destroyed', function () {
    $scope.SEMC.showFooter = false;
    $scope.$emit('$destroy');
    $scope.$digest();
    expect($scope.SEMC.showFooter).to.equal(true);
  });

  describe('actions', function () {
    describe('save', function () {
      it('should broadcast changing panel', function () {
        $scope.actions.save();
        sinon.assert.calledOnce(broadcastStub);
        sinon.assert.calledWith(broadcastStub, 'go-to-panel', 'confirmationForm');
      });
    });

    describe('cancel', function () {
      it('should broadcast changing panel and show the footer', function () {
        $scope.actions.cancel();
        sinon.assert.calledOnce(broadcastStub);
        sinon.assert.calledWith(broadcastStub, 'go-to-panel', 'billingForm', 'back');
      });
    });
  });
});
