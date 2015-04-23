'use strict';

describe('directiveFancySelect'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var $document;
  var $timeout;

  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function ($compile, _$rootScope_, _$document_, _$timeout_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $document = _$document_;
      $timeout = _$timeout_;

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

    var button = element[0];

    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(true);

    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(false);

    expect($elScope.registerOption).to.exist;
  });


  it('Should handle clicking on the document and close the dropdown', function () {
    initState();

    var button = element[0];

    window.helpers.click(button);

    expect($elScope.isOpen).to.equal(true);

    $scope.$broadcast('app-document-click', $document.find('body div')[0]);
    $timeout.flush();

    expect($elScope.isOpen).to.equal(false);
  });



  it('should handle registering an option and selecting it', function () {
    initState();

    var mockOption = {
      selected: false,
      element: angular.element('<div>Hello</div>'),
      value: 'foo'
    };

    $elScope.registerOption(mockOption);

    $scope.value = 'foo';
    $scope.$digest();
    $timeout.flush();

    expect(mockOption.selected).to.equal(true);
  });

});
