var $controller,
    $rootScope;

describe('controllerApp'.bold.underline.blue, function () {
  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  it('initalizes $scope.dataApp properly', function() {
    var $scope = $rootScope.$new();

    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });

    expect($scope.dataApp).to.be.an.Object;
    $rootScope.$digest();
  });
});