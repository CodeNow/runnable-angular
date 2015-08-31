'use strict';

var $controller,
  $rootScope,
  $scope;

describe('DebugController'.bold.underline.blue, function () {
  var mockErrs;
  var DebugController;
  beforeEach(function () {
    mockErrs = {
      handler: sinon.spy(),
      clearErrors: sinon.spy(),
      errors: []
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', mockErrs);
      $provide.value('instance', {});
      $provide.value('debugContainer', {});
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });

    DebugController = $controller('DebugController', {
      '$scope': $scope
    });
  });

  describe('openItems', function () {
    it('should return canSave of true', function () {
      DebugController.openItems.models.push({
        state: {
          isDirty: true
        }
      });
      expect(DebugController.canSave()).to.be.ok;
    });
    it('should allow saving of changes', function () {
      var saveSpy = sinon.spy();
      DebugController.openItems.models.push({
        actions: {
          saveChanges: saveSpy
        }
      });
      DebugController.saveChanges();
      $scope.$digest();

      sinon.assert.calledOnce(saveSpy);
    });
  });
  describe('errs', function () {
    it('should clear errs on close', function () {
      $rootScope.dataApp.data.modalError.actions.close();
      sinon.assert.calledOnce(mockErrs.clearErrors);
    });
    it('should pop up errors if there is a new one', function () {
      mockErrs.errors.push({});
      $rootScope.$digest();
      expect($rootScope.dataApp.data.modalError.data.in).to.be.ok;
      expect($rootScope.dataApp.data.modalError.data.errors).to.equal(mockErrs.errors);
    });
  });
});
