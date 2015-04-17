'use strict';

describe('directiveFancySelect'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var $document;

  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function ($compile, _$rootScope_, _$document_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $document = _$document_;

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


  it('Should handle clicking on the document and close the dropdown', function () {
    initState();
    $scope.$digest();

    var button = element[0].querySelector('button');
    expect(button).to.exist;

    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(true);


    $scope.$broadcast('app-document-click', $document.find('body')[0]);

    expect($elScope.isOpen).to.equal(false);
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
