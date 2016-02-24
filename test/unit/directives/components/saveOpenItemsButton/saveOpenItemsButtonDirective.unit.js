'use strict';

var $rootScope,
  $scope;
var $elScope;
var element;
var $compile;
var keypather;
var $timeout;
var $q;
var SOIBC;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('saveOpenItemsButtonDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var mockMainACV;
  var mockOpenItems;
  var error = new Error('Im an error');
  beforeEach(function () {
    ctx = {};
  });


  beforeEach(function () {
    ctx.SaveOpenItemsButtonController = function () {
      SOIBC = this;
    };
    ctx.SaveOpenItemsButtonController.saveChanges = function () {};
    angular.mock.module('app', function ($provide, $controllerProvider, $urlRouterProvider) {
      $urlRouterProvider.deferIntercept();
      $controllerProvider.register('SaveOpenItemsButtonController', ctx.SaveOpenItemsButtonController);
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
      $q = _$q_;

      mockOpenItems = {};

      mockOpenItems.getAllFileModels = sinon.stub().returns(mockOpenItems.models);

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

      var template = directiveTemplate.attribute('save-open-items-button', {
        instance: 'instance',
        'open-items': 'openItems'
      });
      $scope.instance = mockInstance;
      $scope.openItems = mockOpenItems;
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });
  it('saves changes', function () {
    $elScope.SOIBC.saveChanges = sinon.stub().returns($q.when(true));
    // Timeout
    $elScope.$digest();
    $elScope.save(true);
    expect($elScope.loading).to.be.true;
    $timeout.flush();
    $elScope.$digest();
    // Update models and file updates were called
    expect($elScope.loading).to.be.false;
  });

  it('throws an error, removes spinner', function () {
    $elScope.SOIBC.saveChanges = sinon.stub().returns($q.reject(error));
    // Timeout
    $elScope.$digest();
    $elScope.save();
    expect($elScope.loading).to.be.true;
    $timeout.flush();
    $elScope.$digest();
    // Update models and file updates were called
    expect($elScope.loading).to.be.false;
  });
});
