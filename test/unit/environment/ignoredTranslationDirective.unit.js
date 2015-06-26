'use strict';

describe.only('ignoredTranslationDirective'.bold.underline.blue, function() {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var keypather;
  var loadingPromises;
  var createTransformRuleMock = new (require('../fixtures/mockFetch'))();

  function initState(addToScope) {
    angular.mock.module('app', function ($provide) {
      $provide.factory('createTransformRule', createTransformRuleMock.fetch());
    });
    angular.mock.inject(function($compile, _$rootScope_, _loadingPromises_, _keypather_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      loadingPromises = _loadingPromises_;
      sinon.spy(loadingPromises, 'add');
      $scope.actions = {
        recalculateSilently: sinon.spy()
      };

      var tpl = directiveTemplate.attribute('ignored-translation', {
        'actions': 'actions',
        'state': 'state'
      });

      Object.keys(addToScope).forEach(function (key) {
        $scope[key] = addToScope[key];
      });

      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
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
  it('should be able to handle basic linking of ace'.bold.blue, function() {
    initState({state: {}});
    $scope.$digest();
    var ace = createMockAce();
    element.isolateScope().aceLoaded(ace);
    $scope.$digest();

    $scope.$destroy();
  });

  /** Things that we need to test:

   *
   *  Test features
   *    Nothing on state -> ignoredFilesList = blank
   *    ignores on state -> = ignoredFilesList
   *
   *    ignores on state -> write ignores on ignoredFilesList -> should update
   *    Write ignores on ignoredFilesList -> should update
   *    Delete some ignores -> should update
   *    Delete ALL ignores -> should update
   *
   *    ignores on state -> triggerEvent:toggle (existing) -> should update
   *    ignores on state -> triggerEvent:toggle (not existing) -> should update
   *
   */

  describe('testing interaction of state and ignoredFilesList on link'.bold.blue, function () {
    it('Should not display anything on the page with no current model', function () {
      initState({state: {}});
      $scope.$digest();

      var ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('');
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());
    });

    it('Should display anything on the model', function () {
      var scope = {};
      var files = ['asdasdas', 'asdasdasd'];
      keypather.set(scope, 'state.contextVersion.getMainAppCodeVersion', function () {
        return {
          attrs: {
            transformRules: {
              exclude: files
            }
          }
        };
      });
      initState(scope);
      $scope.$digest();

      var ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('asdasdas\nasdasdasd');
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());
    });

    it('Should display anything on the model when added after the initial link', function () {
      var scope = {};
      var files = ['asdasdas', 'asdasdasd'];
      initState(scope);
      $scope.$digest();
      var ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('');
      keypather.set($scope, 'state.contextVersion.getMainAppCodeVersion', function () {
        return {
          attrs: {
            transformRules: {
              exclude: files
            }
          }
        };
      });
      $scope.$digest();

      ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('asdasdas\nasdasdasd');
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());
    });
  });


  describe('testing adding new ignores'.bold.blue, function () {
    var acv;

    beforeEach(function () {
      initState({state: {}});
      var files = ['asdasdas', 'asdasdasd'];
      $scope.$digest();
      var ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('');
      acv = {
        attrs: {
          transformRules: {
            exclude: files
          }
        }
      };
      keypather.set($scope, 'state.contextVersion.getMainAppCodeVersion', function () {
        return acv;
      });
      $scope.$digest();

      ignores = $elScope.ignoredFilesList;
      expect(ignores).to.equal('asdasdas\nasdasdasd');
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());
    });
    it('Should update when the blur is called', function (done) {
      $elScope.ignoredFilesList += '\nasdfasdfasdfasdfasdf\nasdfasdfasdferqwerw';
      $scope.$digest();
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());

      $elScope.aceBlurred();
      expect($scope.state.processing).to.be.true;
      sinon.assert.calledOnce(loadingPromises.add);

      loadingPromises.finished('editServerModal')
        .then(function () {
          expect($scope.state.processing).to.be.false;
          sinon.assert.calledWith(createTransformRuleMock.getFetchSpy(), acv, [
            'asdasdas',
            'asdasdasd',
            'asdfasdfasdfasdfasdf',
            'asdfasdfasdferqwerw'
          ]);
          done();
        });
      createTransformRuleMock.triggerPromise({});
      $scope.$digest();
    });

    it('Should clear the ignores when all are erased (and on blur)', function (done) {
      $elScope.ignoredFilesList = '';
      $scope.$digest();
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());

      $elScope.aceBlurred();
      $scope.$digest();
      expect($scope.state.processing, 'processing').to.be.true;
      sinon.assert.calledOnce(loadingPromises.add);

      loadingPromises.finished('editServerModal')
        .then(function () {
          expect($scope.state.processing).to.be.false;
          sinon.assert.calledWith(createTransformRuleMock.getFetchSpy(), acv, []);
          sinon.assert.calledOnce($scope.actions.recalculateSilently);
          done();
        });
      createTransformRuleMock.triggerPromise({});
      $scope.$digest();
    });


    it('Should add an ignore when the event is called', function (done) {
      $scope.$broadcast('IGNOREDFILE::toggle', {
        from: '345234562345'
      });
      $scope.$digest();
      expect($scope.state.processing, 'processing').to.be.true;
      sinon.assert.calledOnce(loadingPromises.add);

      $scope.$digest();
      loadingPromises.finished('editServerModal')
        .then(function () {
          expect($scope.state.processing).to.be.false;
          expect($elScope.ignoredFilesList).to.equal('asdasdas\nasdasdasd\n345234562345\n');
          sinon.assert.calledWith(createTransformRuleMock.getFetchSpy(), acv, ['asdasdas', 'asdasdasd', '345234562345']);
          sinon.assert.calledOnce($scope.actions.recalculateSilently);
          done();
        });
      createTransformRuleMock.triggerPromise({});
      $scope.$digest();
    });


    it('Should not add an ignore when the event is called with something already there', function () {
      $scope.$broadcast('IGNOREDFILE::toggle', {
        from: 'asdasdasd'
      });
      $scope.$digest();


      expect($elScope.ignoredFilesList).to.equal('asdasdas\nasdasdasd');
      sinon.assert.notCalled(loadingPromises.add);
      sinon.assert.notCalled(createTransformRuleMock.getFetchSpy());
    });
  });
});
