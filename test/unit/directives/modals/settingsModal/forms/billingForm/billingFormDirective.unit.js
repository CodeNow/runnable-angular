/*global directiveTemplate:true */
'use strict';
var $scope;
var $elScope;

describe('billingFormDirective'.bold.underline.blue, function () {
  var fetchPaymentMethodStub;
  var loadingStub;
  var mockPaymentMethod;
  var broadcastStub;
  beforeEach(function () {
    broadcastStub = sinon.stub();
    mockPaymentMethod = { id: 'paymentMethod' };
    window.helpers.killDirective('billingHistoryForm');
    window.helpers.killDirective('changePaymentForm');
    window.helpers.killDirective('paymentSummary'); // Included from confirmationForm
    window.helpers.killDirective('planStatusForm');
    window.helpers.killDirective('planSummary');
    window.helpers.killDirective('showPaymentForm');
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when(mockPaymentMethod));
        return fetchPaymentMethodStub;
      });
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      keypather
    ) {
      $scope = $rootScope.$new();
      $scope.SEMC = {
        showFooter: false
      };
      keypather.set($rootScope, 'dataApp.data.activeAccount', {
        isInTrial: sinon.stub().returns(true)
      });
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('billing-form');
      var element = $compile(tpl)($scope);
      $scope.$digest();
      $scope.$broadcast = broadcastStub;
      $elScope = element.isolateScope();
    });
  });

  it('should load payment method and set loading state along the way', function () {
    sinon.assert.calledTwice(loadingStub);
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);
    sinon.assert.calledOnce(fetchPaymentMethodStub);
    expect($scope.paymentMethod).to.equal(mockPaymentMethod);
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
        expect($scope.SEMC.showFooter).to.equal(true);
      });
    });
  });
});
