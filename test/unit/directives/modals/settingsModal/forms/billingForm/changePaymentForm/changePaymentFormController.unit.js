/*global expect:true */
'use strict';

var $controller;
var $scope;
var $q;
var $rootScope;

describe('ChangePaymentFormController'.bold.underline.blue, function () {
  var CPFC;
  var stripeCreateTokenStub;
  var loadingStub;
  var fetchPaymentMethodStub;
  var savePaymentMethodStub;
  var mockCurrentOrg;
  var mockFetchPlan;
  var mockFetchWhitelists;

  beforeEach(function () {
    mockCurrentOrg = {
      poppa: {
        isInTrial: sinon.stub().returns(false),
        id: sinon.stub().returns('1234'),
        attrs: {
          allowed: true
        }
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('stripe', function ($q) {
        stripeCreateTokenStub = sinon.stub().returns($q.when({id: 123}));
        return {
          card: {
            createToken: stripeCreateTokenStub
          }
        };
      });
      $provide.factory('fetchPlan', function ($q) {
        mockFetchPlan = sinon.stub().returns($q.when({}));
        return mockFetchPlan;
      });
      $provide.factory('fetchWhitelists', function ($q) {
        mockFetchWhitelists = sinon.stub().returns($q.when([]));
        return mockFetchWhitelists;
      });
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when({}));
        fetchPaymentMethodStub.cache = {
          clear: sinon.stub()
        };
        return fetchPaymentMethodStub;
      });
      $provide.factory('savePaymentMethod', function ($q) {
        savePaymentMethodStub = sinon.stub().returns($q.when({}));
        return savePaymentMethodStub;
      });
      loadingStub = sinon.stub();
      loadingStub.reset = sinon.stub();
      $provide.value('loading', loadingStub);
      $provide.value('currentOrg', mockCurrentOrg);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _$controller_,
      _$q_
    ) {
      $rootScope = _$rootScope_;
      sinon.stub($rootScope, '$broadcast');
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $q = _$q_;
    });

    var laterController = $controller('ChangePaymentFormController', {
      $scope: $scope
    }, true);
    laterController.instance.updating = true;
    laterController.instance.back = sinon.spy();
    laterController.instance.cancel = sinon.spy();
    laterController.instance.close = sinon.spy();
    laterController.instance.save = sinon.spy();
    CPFC = laterController();
  });

  describe('actions', function () {
    describe('save', function () {
      it('should save card in stripe', function () {
        var fakeCC = {
          number: '1234'
        };
        CPFC.card = fakeCC;
        CPFC.actions.save();
        $scope.$digest();
        sinon.assert.calledOnce(CPFC.save);
        sinon.assert.calledOnce(stripeCreateTokenStub);
        sinon.assert.calledWith(stripeCreateTokenStub, fakeCC);
        sinon.assert.calledTwice(loadingStub);
        sinon.assert.calledWith(loadingStub, 'savePayment', true);
        sinon.assert.calledWith(loadingStub, 'savePayment', false);
        sinon.assert.calledWith(loadingStub.reset, 'savePayment');
        sinon.assert.calledOnce(savePaymentMethodStub);
        sinon.assert.calledWith(savePaymentMethodStub, 123);
        sinon.assert.calledOnce(fetchPaymentMethodStub.cache.clear);
        sinon.assert.calledWith($rootScope.$broadcast, 'updated-payment-method');
      });

      it('should handle stripe card errors', function () {
        var fakeCC = {
          number: '1234'
        };
        stripeCreateTokenStub.returns($q.reject({type: 'card_error', message: 'Fake message'}));
        CPFC.card = fakeCC;
        CPFC.actions.save();
        $scope.$digest();
        sinon.assert.notCalled(CPFC.save);
        expect(CPFC.error).to.equal('Fake message');
      });

      it('should handle stripe card errors coming from `savePaymentMethod`', function () {
        var fakeCC = {
          number: '1234'
        };
        savePaymentMethodStub.returns($q.reject({type: 'card_error', message: 'Fake message'}));
        CPFC.card = fakeCC;
        CPFC.actions.save();
        $scope.$digest();
        sinon.assert.notCalled(CPFC.save);
        expect(CPFC.error).to.equal('Fake message');
      });

      it('should handle stripe internal errors', function () {
        var fakeCC = {
          number: '1234'
        };
        stripeCreateTokenStub.returns($q.reject({type: 'api_connection_error', message: 'Fake message'}));
        CPFC.card = fakeCC;
        CPFC.actions.save();
        $scope.$digest();
        sinon.assert.notCalled(CPFC.save);
        expect(CPFC.error).to.not.equal('Fake message');
        expect(CPFC.error).to.match(/connecting/);
      });
    });

    describe('back', function () {
      it('should call back', function () {
        CPFC.actions.back();
        $scope.$digest();
        sinon.assert.calledOnce(CPFC.back);
      });
    });

    describe('cancel', function () {
      it('should call cancel', function () {
        CPFC.actions.cancel();
        $scope.$digest();
        sinon.assert.calledOnce(CPFC.cancel);
      });
    });
  });
});
