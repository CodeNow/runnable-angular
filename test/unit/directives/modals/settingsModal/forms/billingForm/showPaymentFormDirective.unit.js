/*global directiveTemplate:true */
'use strict';
var $scope;

describe('showPaymentFormDirective'.bold.underline.blue, function () {
  var fetchPaymentMethodStub;
  var loadingStub;
  var mockPayment;
  beforeEach(function () {
    mockPayment = {
      card: {
        brand: 'Amex'
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when(mockPayment));
        return fetchPaymentMethodStub;
      });
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope
    ) {
      $scope = $rootScope.$new();
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('show-payment-form');
      $compile(tpl)($scope);
      $scope.$digest();
    });
  });

  it('should load payment information and set loading state along the way', function () {
    sinon.assert.calledTwice(loadingStub);
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);
    sinon.assert.calledOnce(fetchPaymentMethodStub);
    expect($scope.paymentMethod).to.equal(mockPayment);
  });

  describe('getPaymentImage', function () {
    it('should translate the credit card to an image', function () {
      expect($scope.getPaymentImage()).to.equal('/build/images/logos/credit-cards/logo-cc-amex.svg');
    });
    it('should return nothing when there is no match', function () {
      $scope.paymentMethod = {};
      expect($scope.getPaymentImage()).to.equal('');
    });
  });
});
