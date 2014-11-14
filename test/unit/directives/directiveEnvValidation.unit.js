describe('directiveEnvValidation'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;

  function initState (addToScope) {
    angular.mock.module('app');
    angular.mock.inject(function($compile, _$rootScope_, $timeout){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      $rootScope.safeApply = function(cb) {
        $timeout(function () {
          $scope.$digest();
        });
      };

      var tpl = directiveTemplate('env-validation', {
        'state-model': 'stateModel'
      });

      Object.keys(addToScope).forEach(function (key) {
        $scope[key] = addToScope[key];
      });

      element = $compile(tpl)($scope);
      $scope.$digest();
    });
  }

  it('Should return valid when no envs are in the envModel', function () {
    initState({});
    $scope.$digest();

    var validEnv = element.isolateScope().envValidation;
    expect(validEnv).to.be.an.Object;
    expect(validEnv.valid).to.be.true;
  });

  it('Should return valid with valid envs', function () {
    // Using an invalid dockerfile here - otherwise we can't be sure the validator was run
    initState({ stateModel: {
      env: ['as=hnds']
    }});
    $scope.$digest();

    var validEnv = element.isolateScope().envValidation;
    expect(validEnv).to.be.an.Object;
    expect(validEnv.valid).to.be.true;
  });

  it('Should return invalid with invalid envs', function () {
    // Using an invalid dockerfile here - otherwise we can't be sure the validator was run
    initState({ stateModel: {
      env: ['as=hnds', '213123dsasd  fasd fasdf asd']
    }});
    $scope.$digest();

    var validEnv = element.isolateScope().envValidation;
    expect(validEnv).to.be.an.Object;
    expect(validEnv.valid).to.be.false;
  });
});