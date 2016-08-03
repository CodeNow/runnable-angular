/*global expect:true */
'use strict';

var $controller;
var $scope;
var $q;

describe('ChangePaymentFormController'.bold.underline.blue, function () {
  var CPFC;
  var stripeCreateTokenStub;
  var loadingStub;

  function setup() {
    angular.mock.module('app', function ($provide) {
      $provide.factory('stripe', function ($q) {
        stripeCreateTokenStub = sinon.stub().returns($q.resolve({id: 123}));
        return {
          card: {
            createToken: stripeCreateTokenStub
          }
        };
      });
      loadingStub = sinon.stub();
      loadingStub.reset = sinon.stub();
      $provide.value('loading', loadingStub);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $q = _$q_;
    });

    var laterController = $controller('ChangePaymentFormController', {
      $scope: $scope
    }, true);
    laterController.updating = 'true';
    laterController.back = sinon.spy();
    laterController.cancel = sinon.spy();
    laterController.save = sinon.spy();
    CPFC = laterController();
  }

  describe('Init', function () {
    beforeEach(function () {
      setup();
    });

    it('should coerce the updating field to a boolean', function () {
      expect(CPFC.updating).to.equal(false);
    });
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
