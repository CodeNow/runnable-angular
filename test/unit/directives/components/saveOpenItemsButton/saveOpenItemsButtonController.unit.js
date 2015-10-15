'use strict';

var $controller,
  $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $timeout;
var $q;
var SOIBC;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('saveOpenItemsButtonController'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var mockUpdateInstanceWithNewBuild;
  var promisifyMock;
  var mockMainACV;
  var mockOpenItems;
  var error = new Error('Im an error');
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
        saveChanges: sinon.spy(function () {
          var d = $q.defer();
          if (throwErr) {
            d.reject(error);
          } else {
            d.resolve();
          }
          return d.promise;
        })
      }
    };
  }
  beforeEach(function () {
    ctx = {};
  });


  beforeEach(function () {
    mockUpdateInstanceWithNewBuild = sinon.stub();
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.value('loading', ctx.loadingMock);
      $provide.value('updateInstanceWithNewBuild', mockUpdateInstanceWithNewBuild);
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });
    angular.mock.inject(function (_$controller_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $timeout = _$timeout_;
      $q = _$q_;


      mockOpenItems = {
        models: [
          genModel('name', 'anotherName'),
          genModel('aname'),
          genModel()
        ]
      };

      mockOpenItems.getAllFileModels = sinon.stub().returns(mockOpenItems.models);
      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        }
      };

      var laterController = $controller('SaveOpenItemsButtonController', {
        $scope: $scope
      }, true);
      laterController.instance.instance = mockInstance;
      laterController.instance.openItems = mockOpenItems;
      SOIBC = laterController();
    });
  });
  it('saves changes', function () {
    SOIBC.saveChanges();
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    $scope.$digest();
    sinon.assert.notCalled(mockInstance.restart);
    sinon.assert.called(mockOpenItems.getAllFileModels);
    sinon.assert.calledWith(mockOpenItems.getAllFileModels, true);
  });

  it('saves changes and restarts', function () {
    SOIBC.saveChanges(true);
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    $scope.$digest();
    sinon.assert.called(mockInstance.restart);
    sinon.assert.called(mockOpenItems.getAllFileModels);
    sinon.assert.calledWith(mockOpenItems.getAllFileModels, true);
  });

  it('throws an error on a bad update', function () {
    SOIBC.openItems = {
      models : [genModel('a', 'b', true)]
    };
    SOIBC.openItems.getAllFileModels = sinon.stub().returns(SOIBC.openItems.models);

    $scope.$digest();
    SOIBC.saveChanges(true);
    $scope.$digest();
    sinon.assert.called(SOIBC.openItems.models[0].actions.saveChanges);
    sinon.assert.calledWith(ctx.errsMock.handler, error);
    sinon.assert.called(SOIBC.openItems.getAllFileModels);
    sinon.assert.calledWith(SOIBC.openItems.getAllFileModels, true);
  });

  it('throws an error on a bad restart', function () {
    SOIBC.instance = {
      restart: sinon.stub().returns($q.reject(error))
    };
    $scope.$digest();
    SOIBC.saveChanges(true);
    $scope.$digest();
    sinon.assert.calledOnce(SOIBC.instance.restart);
    sinon.assert.calledWith(ctx.errsMock.handler, error);
    sinon.assert.called(mockOpenItems.getAllFileModels);
    sinon.assert.calledWith(mockOpenItems.getAllFileModels, true);
  });
});
