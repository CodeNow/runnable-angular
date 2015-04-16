'use strict';

describe('directiveFancySelect'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;


  function initState() {
    angular.mock.module('app');
    //angular.mock.module(function ($provide) {
    //  $provide.value('modelist', {
    //    getModeForPath: getModeForPathSpy
    //  });
    //});
    angular.mock.inject(function ($compile, _$rootScope_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      $scope.value = null;
      $scope.placeholder = 'This is a custom placeholder';
      var tpl = directiveTemplate('fancy-select', {
        value: 'value',
        placeholder: 'placeholder'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  it('Should add a button with click handlers to the page', function () {
    initState();
    $scope.$digest();

    var button = element[0].querySelector('button');
    expect(button).to.exist;
    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(true);

    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(false);

    expect($elScope.registerOption).to.exist;

  });



  it('should handle registering an option and selecting it', function () {
    initState();
    $scope.$digest();

    var mockOption = {
      selected: false,
      element: angular.element('<div>Hello</div>'),
      value: 'foo'
    };

    $elScope.registerOption(mockOption);

    $scope.value = 'foo';
    $scope.$digest();

    expect(mockOption.selected).to.equal(true);
  });

});
