/*global directiveTemplate:true */
'use strict';
var $scope;
var $elScope;
var keypather;

describe('changePaymentFormDirective'.bold.underline.blue, function () {
  beforeEach(function () {
    angular.mock.module('app', function ($provide) {});
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
      keypather.set($scope, 'paymentForm.cardNumber.$ccEagerType', 'American Express');
      expect($scope.getCardClass()).to.equal('amex');
    });

    it('should return nothing if the card class does not exist', function () {
      keypather.delete($scope, 'paymentForm.cardNumber.$ccEagerType');
      expect($scope.getCardClass()).to.equal(undefined);
    });
  });
  describe('isCCExpValid', function () {
    it('should return true if nothing has been touched', function () {
      keypather.set($scope, 'paymentForm.ccExpMonth.$touched', false);
      keypather.set($scope, 'paymentForm.ccExpYear.$touched', false);
      expect($scope.isCCExpValid()).to.equal(true);
    });

    it('should return false if the exp month is invalid', function () {
      keypather.set($scope, 'paymentForm.ccExpMonth.$touched', true);
      keypather.set($scope, 'paymentForm.ccExpMonth.$valid', false);
      expect($scope.isCCExpValid()).to.equal(false);
    });

    it('should return false if the exp year is invalid', function () {
      keypather.set($scope, 'paymentForm.ccExpYear.$touched', true);
      keypather.set($scope, 'paymentForm.ccExpYear.$valid', false);
      expect($scope.isCCExpValid()).to.equal(false);
    });

    it('should return false if the expiration as a whole is invalid', function () {
      keypather.set($scope, 'paymentForm.ccExpYear.$touched', true);
      keypather.set($scope, 'paymentForm.ccExpYear.$valid', true);
      keypather.set($scope, 'paymentForm.ccExpMonth.$touched', true);
      keypather.set($scope, 'paymentForm.ccExpMonth.$valid', true);
      keypather.set($scope, 'paymentForm.$error.ccExp', 'CC exp has an error');
      expect($scope.isCCExpValid()).to.equal(false);
    });
  });
});
