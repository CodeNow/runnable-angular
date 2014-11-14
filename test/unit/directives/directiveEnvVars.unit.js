describe('directiveEnvVars'.bold.underline.blue, function() {
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

      var tpl = directiveTemplate('env-vars', {
        'items': 'items',
        'current-model': 'currentModel',
        'state-model': 'stateModel'
      });

      Object.keys(addToScope).forEach(function (key) {
        $scope[key] = addToScope[key];
      });

      element = $compile(tpl)($scope);
      $scope.$digest();
    });
  }

  /** Things that we need to test:
   *  3 use cases
   *    1 Setup         -> no currentModel
   *    2 Instance      -> no stateModel
   *    3 InstanceEdit  -> both
   *
   *  Test features
   *    1/2/3 Nothing on currentModel -> environmentalVars = blank
   *    2/3   Envs on currentModel -> = environmentalVars
   *
   *    3     Envs on currentModel, write envs on environmentalVars -> stateModel should be updated
   *    1/3   Write envs on environmentalVars -> stateModel should be updated
   *    1/3   Delete some envs -> stateModel should be updated
   *    1/3   Delete ALL envs -> stateModel should be updated
   */

  /**
   * Borderline useless helper function, just for funzies
   * @param envs env array
   * @returns {{env: *}}
   */
  function createEnvModel(envs) {
    return {
      env: envs
    };
  }
  describe('with no data in the current model'.bold.blue, function() {
    it('Should not display anything on the page with no current model', function () {
      initState({stateModel: {}});
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal('');
      expect($scope.stateModel.env).to.equal(undefined);
    });
    it('Should not display anything on the page with no input', function () {
      initState({currentModel: createEnvModel([])});
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal('');
    });

    it('Should not display or save anything on the page with no input', function () {
      initState({
        currentModel: createEnvModel([]),
        stateModel: {}
      });
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal('');
      expect($scope.stateModel.env).to.equal(undefined);
    });
  });

  describe('with envs in the current model'.bold.blue, function() {
    it('Should display envs from current model, no stateModel', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs)
      });
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal(envs.join('\n') + '\n');
    });

    it('Should display envs from current model', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {}
      });
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal(envs.join('\n') + '\n');
      expect($scope.stateModel.env).to.equal(undefined);
    });
  });

  describe('modifying the envs'.bold.blue, function() {
    it('should add new envs to stateModel', function () {
      initState({
        stateModel: {}
      });
      var addedEnvs = ['lms=asd', 'db=awe'];
      element.isolateScope().environmentalVars += addedEnvs.join('\n');
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal(addedEnvs.join('\n'));
      expect($scope.stateModel.env.length).to.equal(addedEnvs.length);
      addedEnvs.forEach(function (env, index) {
        expect($scope.stateModel.env[index]).to.equal(env);
      });
    });

    it('should add current and new envs to stateModel', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {}
      });
      var addedEnvs = ['lms=asd', 'db=awe'];
      element.isolateScope().environmentalVars += addedEnvs.join('\n');
      $scope.$digest();
      var expectedEnvs = envs.concat(addedEnvs);

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal(expectedEnvs.join('\n'));
      expect($scope.stateModel.env.length).to.equal(expectedEnvs.length);
      expectedEnvs.forEach(function (env, index) {
        expect($scope.stateModel.env[index]).to.equal(env);
      });
    });

    it('should remove some envs, and set them in the stateModel', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {}
      });
      var addedEnvs = ['a=b', 'x=y'];
      element.isolateScope().environmentalVars = addedEnvs.join('\n');
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal(addedEnvs.join('\n'));
      expect($scope.stateModel.env.length).to.equal(addedEnvs.length);
      addedEnvs.forEach(function (env, index) {
        expect($scope.stateModel.env[index]).to.equal(env);
      });
    });

    it('should remove all envs, and clear them in the stateModel', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {}
      });
      element.isolateScope().environmentalVars = '';
      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal('');
      expect($scope.stateModel.env.length).to.equal(0);
    });
  });
});