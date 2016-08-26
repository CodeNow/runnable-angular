'use strict';

var $rootScope;
var keypather;
var createAndBuildNewContainer;
var savePaymentMethod;

describe('billingService'.bold.underline.blue, function () {
  var errsStub;
  var currentOrgStub;
  var orgPoppaId = 342;
  var configAPIHost = 'http://api.runnable-gamma.com';
  var $httpStub;
  var httpResponse;

  function setup() {
    httpResponse = {
      status: 200,
      data: {}
    };
    errsStub = {
      handler: sinon.stub()
    };
    currentOrgStub = {
      poppa: {
        id: sinon.stub().returns(orgPoppaId)
      }
    };
    var httpFactory = function ($q) {
      $httpStub = sinon.stub().returns($q.when(httpResponse));
      return $httpStub;
    };
    angular.mock.module('app');
    angular.mock.module('app', function ($provide) {
      $provide.value('configAPIHost', configAPIHost);
      $provide.value('currentOrg', currentOrgStub);
      $provide.factory('$http', httpFactory);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _savePaymentMethod_,
      _keypather_
    ) {
      $rootScope = _$rootScope_;
      savePaymentMethod = _savePaymentMethod_;
      keypather = _keypather_;
    });
  }

  beforeEach(setup);

  describe('savePaymentMethod', function () {
    var token = 'tok_2342342323';

    it('should make an HTTP request', function () {
      savePaymentMethod(token);
      $rootScope.$digest();

      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWithExactly($httpStub, {
        method: 'post',
        url: configAPIHost + '/billing/payment-method',
        params: {
          organizationId: orgPoppaId
        },
        data: {
          stripeToken: token
        }
      });
    });

    it('should return the data if succseful', function () {
      var res;
      savePaymentMethod(token)
        .then(function (_res) {
          res = _res;
        });
      $rootScope.$digest();

      expect(res).to.equal(httpResponse.data);
    });

    it('should throw any errors', function () {
      httpResponse.status = 400;
      httpResponse.data = { error: 'WOW' };
      var err;
      savePaymentMethod(token)
        .catch(function (_err) {
          err = _err;
        });
      $rootScope.$digest();

      expect(err.message).to.equal('WOW');
    });

    it('should coerce Stripe card errors', function () {
      httpResponse.status = 400;
      httpResponse.data = { message: 'ValidationError: StripeCardError: Your card is ugly' };
      var err;
      savePaymentMethod(token)
        .catch(function (_err) {
          err = _err;
        });
      $rootScope.$digest();

      expect(err.type).to.equal('card_error');
      expect(err.message).to.equal('Your card is ugly');
    });

    it('should coerce Stripe card errors with no message', function () {
      httpResponse.status = 400;
      httpResponse.data = { message: 'ValidationError: StripeCardError' };
      var err;
      savePaymentMethod(token)
        .catch(function (_err) {
          err = _err;
        });
      $rootScope.$digest();

      expect(err.type).to.equal('card_error');
      expect(err.message).to.equal('Unknown card error');
    });
  });
});
