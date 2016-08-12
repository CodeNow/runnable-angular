/*global expect:true */
'use strict';

var $controller;
var $scope;
var $q;
var $rootScope;
var keypather;

describe('ChangePaymentFormController'.bold.underline.blue, function () {
  var CPFC;
  var stripeCreateTokenStub;
  var loadingStub;
  var fetchPaymentMethodStub;

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.factory('stripe', function ($q) {
        stripeCreateTokenStub = sinon.stub().returns($q.when({id: 123}));
        return {
          card: {
            createToken: stripeCreateTokenStub
          }
        };
      });
      $provide.factory('fetchPaymentMethod', function ($q) {
        fetchPaymentMethodStub = sinon.stub().returns($q.when({}));
        return fetchPaymentMethodStub;
      });
      loadingStub = sinon.stub();
      loadingStub.reset = sinon.stub();
      $provide.value('loading', loadingStub);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_
    ) {
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $q = _$q_;
    });

    keypather.set($rootScope, 'dataApp.data.activeAccount', {
      isInTrial: sinon.stub().returns(true)
    });

    var laterController = $controller('ChangePaymentFormController', {
      $scope: $scope
    }, true);
    laterController.instance.updating = true;
    laterController.instance.back = sinon.spy();
    laterController.instance.cancel = sinon.spy();
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
