'use strict';

describe('directiveEnvVars'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $rootScope;
  var mockValidateEnv;
  var mockValidateReturnValue;

  function initState (addToScope) {
    mockValidateEnv = sinon.spy(function () {
      return {
        errors: mockValidateReturnValue
      };
    });
    angular.mock.module('app', function ($provide) {
      $provide.value('validateEnvVars', mockValidateEnv);
    });
    angular.mock.inject(function($compile, _$rootScope_, $timeout){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      var tpl = directiveTemplate.attribute('env-vars', {
        'validation': 'validation',
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

  function createMockAce() {
    var cache = {
      insert: [],
      deco: {}
    };
    return {
      session: {
        setAnnotations : sinon.spy(),
        clearAnnotations : sinon.spy(),
        $stopWorker: function () {}
      },
      renderer: {
        lineHeight: 0
      },
      insert: function (text) {
        cache.insert.push(text);
      },
      getValue: function () {
        return cache.insert.join('\n');
      },
      focus: function () {
        cache.focus = true;
      },
      getCache: function () {
        return cache;
      },
      destroy: function () {}
    };
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

    it('Should display envs from stateModel when they exist', function () {
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
      var isolatedScope = element.isolateScope();

      isolatedScope.environmentalVars = addedEnvs.join('\n');
      var mockAce = createMockAce();
      isolatedScope.aceLoaded(mockAce);

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
      var isolatedScope = element.isolateScope();
      isolatedScope.environmentalVars += addedEnvs.join('\n');
      var mockAce = createMockAce();
      isolatedScope.aceLoaded(mockAce);

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
      var isolatedScope = element.isolateScope();

      isolatedScope.environmentalVars = addedEnvs.join('\n');
      var mockAce = createMockAce();
      isolatedScope.aceLoaded(mockAce);

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
      var isolatedScope = element.isolateScope();

      isolatedScope.environmentalVars = '';
      var mockAce = createMockAce();
      isolatedScope.aceLoaded(mockAce);

      $scope.$digest();

      var environmentalVars = element.isolateScope().environmentalVars;
      expect(environmentalVars).to.equal('');
      expect($scope.stateModel.env.length).to.equal(0);
      $scope.$apply();
      $scope.$broadcast('$destroy');
    });

    // New stuff to test
    // tests validations are added to the gutter
    // test eventPaste

    it('should add gutter decorations to mock editor', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {},
        validation:  {}
      });
      element.isolateScope().environmentalVars = '';
      $scope.$digest();

      var isolatedScope = element.isolateScope();
      var mockAce = createMockAce();
      isolatedScope.aceLoaded(mockAce);

      $scope.$apply();

      var firstErrors = [10, 13, 20];
      var secondErrors = [16];

      mockValidateReturnValue = firstErrors;
      element.isolateScope().environmentalVars = 'adsfasdfadsf';
      $scope.$apply();
      sinon.assert.calledOnce(mockAce.session.setAnnotations);
      mockAce.session.setAnnotations.reset();

      // Now we should remove them
      mockValidateReturnValue = null;
      element.isolateScope().environmentalVars = 'sadas';
      $scope.$apply();

      sinon.assert.notCalled(mockAce.session.setAnnotations);
      sinon.assert.calledOnce(mockAce.session.clearAnnotations);
      mockAce.session.setAnnotations.reset();
      mockAce.session.clearAnnotations.reset();

      mockValidateReturnValue = secondErrors;
      element.isolateScope().environmentalVars = 'asdf';
      $scope.$apply();


      sinon.assert.notCalled(mockAce.session.clearAnnotations);
      sinon.assert.calledOnce(mockAce.session.setAnnotations);

      $scope.$broadcast('$destroy');
      $scope.$apply();

    });
    it('should listen to the eventPasteLinkedInstance', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {},
        validation:  {}
      });
      element.isolateScope().environmentalVars = '';
      $scope.$digest();
      var mockAce = createMockAce();
      mockAce.renderer.lineHeight = 14;

      var isolatedScope = element.isolateScope();
      isolatedScope.aceLoaded(mockAce);

      var testedText = 'Hello, everybody!';
      $scope.$broadcast('eventPasteLinkedInstance', testedText);
      expect(mockAce.getCache().insert[0]).to.equal(testedText);
      expect(mockAce.renderer.lineHeight).to.equal(14);

      $scope.$apply();
      $scope.$broadcast('$destroy');
    });

    it('should destroy scope before the ace is loaded', function () {
      var envs = ['a=b', 'x=y', 'dasdasd=asfa'];
      initState({
        currentModel: createEnvModel(envs),
        stateModel: {},
        validation:  {}
      });
      element.isolateScope().environmentalVars = '';
      $scope.$digest();

      $scope.$apply();
      $scope.$broadcast('$destroy');

    });
  });
});
