'use strict';

describe('animatedPanelContainerDirective'.bold.underline.blue, function() {
  var $compile;
  var $scope;
  var $elScope;
  var $rootScope;
  var $timeout;
  function setup() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
    });

    $scope.registerPanel = sinon.spy();
    $scope.getPanelClass = sinon.spy();

    var template = directiveTemplate('animated-panel', {
      name: 'test-name',
      default: 'true'
    });
    var element = $compile(template)($scope);
    $scope.$digest();
    $elScope = element.scope();
    $scope.$digest();
  }

  beforeEach(function () {
    setup();
  });

  it('should register itself on init', function () {
    sinon.assert.calledOnce($scope.registerPanel);
    sinon.assert.calledWith($scope.registerPanel, 'test-name');
    expect($scope.registerPanel.lastCall.args[2]).to.equal(true);

    sinon.assert.called($scope.getPanelClass);
    sinon.assert.calledWith($scope.getPanelClass, 'test-name');
  });

  it('should return true when active', function () {
    $scope.activePanel = 'test-name';
    expect($elScope.isActive()).to.be.ok;
  });
  it('should return false when inactive', function () {
    $scope.activePanel = 'not-me';
    expect($elScope.isActive()).to.not.be.ok;
  });
});
