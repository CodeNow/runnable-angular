/*global directiveTemplate:true */
'use strict';
var $scope;
var $elScope;
var keypather;

describe('changePaymentFormDirective'.bold.underline.blue, function () {
  var fetchPaymentMethodStub;
  var mockCurrentOrg;
  var mockFetchPlan;
  beforeEach(function () {
    mockCurrentOrg = {
      poppa: {
        isInTrial: sinon.stub().returns(true),
        attrs: {
          activePeriodEnd: '2016-08-12T21:24:06.000Z'
        },
        id: sinon.stub().returns(1234)
      }
    };
    window.helpers.killDirective('planSummary');
    window.helpers.killDirective('paymentSummary');
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when({}));
        return fetchPaymentMethodStub;
      });
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.factory('fetchPlan', function ($q) {
        mockFetchPlan = sinon.stub().returns($q.when({}));
        return mockFetchPlan;
      });
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      _keypather_
    ) {
      keypather = _keypather_;
      $scope = $rootScope.$new();
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('change-payment-form', {
        'save': 'save',
        'updating': 'false'
      });
      var element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  describe('getCardClass', function () {
    it('should return a mapped version of the card class', function () {
      keypather.set($elScope, 'paymentForm.cardNumber.$ccEagerType', 'American Express');
      expect($elScope.getCardClass()).to.equal('amex');
    });

    it('should return nothing if the card class does not exist', function () {
      keypather.del($elScope, 'paymentForm.cardNumber.$ccEagerType');
      expect($elScope.getCardClass()).to.equal(undefined);
    });
  });
  describe('isCCExpValid', function () {
    it('should return true if nothing has been touched', function () {
      keypather.set($elScope, 'paymentForm.ccExpMonth.$touched', false);
      keypather.set($elScope, 'paymentForm.ccExpYear.$touched', false);
      expect($elScope.isCCExpValid()).to.equal(true);
    });

    it('should return false if the exp month is invalid', function () {
      keypather.set($elScope, 'paymentForm.ccExpMonth.$touched', true);
      keypather.set($elScope, 'paymentForm.ccExpMonth.$valid', false);
      expect($elScope.isCCExpValid()).to.equal(false);
    });

    it('should return false if the exp year is invalid', function () {
      keypather.set($elScope, 'paymentForm.ccExpYear.$touched', true);
      keypather.set($elScope, 'paymentForm.ccExpYear.$valid', false);
      expect($elScope.isCCExpValid()).to.equal(false);
    });

    it('should return false if the expiration as a whole is invalid', function () {
      keypather.set($elScope, 'paymentForm.ccExpYear.$touched', true);
      keypather.set($elScope, 'paymentForm.ccExpYear.$valid', true);
      keypather.set($elScope, 'paymentForm.ccExpMonth.$touched', true);
      keypather.set($elScope, 'paymentForm.ccExpMonth.$valid', true);
      keypather.set($elScope, 'paymentForm.$error.ccExp', 'CC exp has an error');
      expect($elScope.isCCExpValid()).to.equal(false);
    });
  });

  describe('getBillingDate', function () {
    it('should return the billing date', function () {
      expect($elScope.getBillingDate()).to.equal('Aug 12th, 2016');
    });
  });
});
