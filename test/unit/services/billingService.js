'use strict';

var $rootScope;
var keypather;
var createAndBuildNewContainer;
var savePaymentMethod;

describe.only('billingService'.bold.underline.blue, function () {
  var errsStub;
  var currentOrgStub;
  var orgPoppaId = 342;
  var configAPIHost = 'http://api.runnable-gamma.com';
  var $httpStub;

  function setup() {
    console.log(' SSETUP ***');
    errsStub = {
      handler: sinon.stub()
    };
    currentOrgStub = {
      poppa: {
        id: sinon.stub().returns(orgPoppaId)
      }
    };
    var httpFactory = function ($q) {
      $httpStub = sinon.stub().returns($q.when({
        data: {}
      }));
      $httpStub.get = sinon.stub().returns($q.when({
        data: {}
      }));
      return $httpStub;
    };
    angular.mock.module('app');
    console.log('APP');
    angular.mock.module('app', function ($provide) {
      console.log('provide');
      $provide.value('configAPIHost', configAPIHost);
      $provide.value('currentOrg', currentOrgStub);
      console.log('httpFactory');
      console.log(httpFactory);
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

  describe('savePaymentMethod', function () {

    console.log('savePaymentMethod !!!');
    beforeEach(function () {
      console.log('before each');
      setup();
    });

    var token = 'tok_2342342323';
    it('should make an HTTP request', function () {
      savePaymentMethod(token);
      $rootScope.$digest();
    });
  });
});
