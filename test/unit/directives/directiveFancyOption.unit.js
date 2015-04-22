'use strict';

describe('directiveFancySelect'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;


  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function ($compile, _$rootScope_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      $scope.registerOption = sinon.spy();
      $scope.actions = {
        clickedOption: sinon.spy()
      };

      $scope.value = 'test1234';
      var tpl = directiveTemplate('fancy-option', {
        value: 'value'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  it('Should add a button with click handlers to the page', function () {
    initState();
    $scope.$digest();

    sinon.assert.calledOnce($scope.registerOption);
    sinon.assert.notCalled($scope.actions.clickedOption);

    var listItem = element[0].querySelector('li');
    expect(listItem).to.exist;
    window.helpers.click(listItem);

    sinon.assert.calledOnce($scope.actions.clickedOption);
  });

});
