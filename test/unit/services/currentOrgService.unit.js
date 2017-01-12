'use strict';

var keypather;
var currentOrg;
var mockOrg = {
  poppa: {
    attrs: {
      allowed: true,
      isActive: true,
      isPersonalAccount: true,
      isPermanentlyBanned: false
    },
    isGraceExpired: sinon.stub().returns(true),
    isInGrace: sinon.stub().returns(true),
  }
}

describe('currentOrgService'.bold.underline.blue, function () {

  function setup() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _keypather_,
      _currentOrg_
    ) {
      currentOrg = _currentOrg_;
      keypather = _keypather_;
      currentOrg = angular.extend(currentOrg, mockOrg);
    });
  }

  beforeEach(setup);

  describe('isPersonalAccount Method', function () {
    it('should return true for a personal account', function () {
      var isPersonalAccount = currentOrg.isPersonalAccount();
      expect(isPersonalAccount).to.equal(true);
    });
  });

  describe('willAcceptPayment method', function () {
    it('should return true if the organization is not banned', function () {
      var willAcceptPayment = currentOrg.willAcceptPayment();
      expect(willAcceptPayment).to.equal(true);
    });
    it('should return false if the organization is banned', function () {
      currentOrg.poppa.attrs.isPermanentlyBanned = true;
      var willAcceptPayment = currentOrg.willAcceptPayment();
      expect(willAcceptPayment).to.equal(false);
    });
  });

  describe('isPaymentDue Method', function () {
    it('should return true if the org is in grace and will accept payment', function () {
      currentOrg.poppa.attrs.isPermanentlyBanned = false;
      var isPaymentDue = currentOrg.isPaymentDue();
      expect(isPaymentDue).to.equal(true);
    });
    it('should return false if the org is allowed and not in grace', function () {
      currentOrg.poppa.attrs.allowed = true;
      currentOrg.poppa.isInGrace = sinon.stub().returns(false);
      var isPaymentDue = currentOrg.isPaymentDue();
      expect(isPaymentDue).to.equal(false);
    });
  });

  describe('isPaused Method', function () {
    it('should return false for a non banned account', function () {
      var isPaused = currentOrg.isPaused();
      expect(isPaused).to.equal(false);
    });
    it('should return true for a banned account', function () {
      currentOrg.poppa.attrs.isPermanentlyBanned = true;
      var isPaused = currentOrg.isPaused();
      expect(isPaused).to.equal(true);
    });
  });
});
