'use strict';

describe('directiveInstancePrimaryActions'.bold.underline.blue, function () {
  var element,
      $scope,
      $elScope,
      $rootScope,
      $timeout;

  var error = new Error('an Error');
  function genModel (name, newName, throwErr) {
    if (!newName) {
      newName = name;
    }
    return {
      attrs: {
        body: name
      },
      state: {
        body: newName
      },
      actions: {
        saveChanges: sinon.spy()
      }
    };
  }

  var mockOpenItems,
      ctx,
      mockInstance;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {

    ctx.errsMock = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
    });
    angular.mock.inject(function ($compile, _$timeout_, _$rootScope_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;

      mockOpenItems = {
        models: [
          genModel('name', 'anotherName'),
          genModel('aname'),
          genModel()
        ]
      };

      mockInstance = {
        restart: sinon.spy(function (cb) { cb(); }),
        fetch: sinon.spy(function (cb) { cb(); })
      };

      $scope.loading = true;
      $scope.instance = mockInstance;
      $scope.saving = true;
      $scope.openItems = mockOpenItems;

      var template = directiveTemplate('instance-primary-actions', {
        loading: 'loading',
        instance: 'instance',
        saving: 'saving',
        'open-items': 'openItems'
      });
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  it('initalizes scope properly', function() {
    expect($elScope.saving).to.be.false;
    expect($elScope.loading).to.be.false;

    expect($elScope.popoverSaveOptions).to.deep.equal({
      actions: {},
      data: {
        show: false,
        restartOnSave: false
      }
    });

    expect($elScope.saveChanges).to.be.a.Function;
  });

  it('saves changes', function() {
    $elScope.saveChanges();
    expect($elScope.saving).to.be.true;
    // Timeout
    $timeout.flush();
    expect($elScope.saving).to.be.false;
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    sinon.assert.notCalled(mockInstance.restart);
  });

  it('saves changes and restarts', function() {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.saveChanges();
    expect($elScope.saving).to.be.true;
    // Timeout
    $timeout.flush();
    expect($elScope.saving).to.be.false;
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    sinon.assert.called(mockInstance.restart);
  });

  it.skip('throws an error on a bad update', function() {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.openItems = {
      models : [genModel('a', 'b', true)]
    };
    $scope.$digest();
    $elScope.saveChanges();
    $scope.$digest();
    sinon.assert.called($elScope.openItems.models[0].actions.saveChanges);
    sinon.assert.calledWith(ctx.errsMock.handler, error);
  });

  it('throws an error on a bad restart', function() {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.instance = {
      restart: sinon.spy(function (cb) { cb(error); })
    };
    $scope.$digest();
    $elScope.saveChanges();
    $scope.$digest();
    sinon.assert.calledWith(ctx.errsMock.handler, error);

    sinon.assert.called($elScope.instance.restart);
  });

});
