var $controller,
    $rootScope,
    $scope;

describe('controllerApp'.bold.underline.blue, function () {
  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });
  });

  it('initalizes $scope.dataApp properly', function() {
    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });

    expect($scope.dataApp).to.be.an.Object;
    $rootScope.$digest();
  });

  it('creates a click handler that broadcasts', function() {
    var clicked;
    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });

    $rootScope.$digest();

    $scope.$on('app-document-click', function() {
      clicked = true;
    });

    $scope.dataApp.documentClickEventHandler();

    expect(clicked).to.be.true;
  });
});