'use strict';

describe('directiveInstancePrimaryActions'.bold.underline.blue, function () {
  var element,
      $scope,
      $elScope,
      $rootScope,
      $timeout,
      $q;

  var error = new Error('an Error');
  function genModel (name, newName, throwErr) {
    if (!newName) {
      newName = name;
    }
    return {
      attrs: {
        body: name
      },
      state: {
        body: newName
      },
      actions: {
        saveChanges: sinon.spy(function () {
          var d = $q.defer();
          if (throwErr) {
            d.reject(error);
          } else {
            d.resolve();
          }
          return d.promise;
        })
      }
    };
  }

  var mockOpenItems,
      ctx,
      mockInstance;
  var mockUpdateInstanceWithNewBuild;
  var promisifyMock;
  var mockMainACV;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {

    mockUpdateInstanceWithNewBuild = sinon.stub();
    ctx.errsMock = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.value('updateInstanceWithNewBuild', mockUpdateInstanceWithNewBuild);
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });
    angular.mock.inject(function ($compile, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      $q = _$q_;

      mockOpenItems = {
        models: [
          genModel('name', 'anotherName'),
          genModel('aname'),
          genModel()
        ]
      };

      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        }
      };

      $scope.loading = true;
      $scope.instance = mockInstance;
      $scope.saving = true;
      $scope.openItems = mockOpenItems;

      var template = directiveTemplate.attribute('instance-primary-actions', {
        loading: 'loading',
        instance: 'instance',
        saving: 'saving',
        'open-items': 'openItems'
      });
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  it('initalizes scope properly', function () {
    expect($elScope.saving).to.be.false;
    expect($elScope.loading).to.be.true;

    expect($elScope.popoverSaveOptions).to.deep.equal({
      data: {
        show: false,
        restartOnSave: false
      },
      actions: {}
    });

    expect($elScope.saveChanges).to.be.a.Function;
  });

  it('saves changes', function () {
    $elScope.saveChanges();
    expect($elScope.saving).to.be.true;
    // Timeout
    $timeout.flush();
    expect($elScope.saving).to.be.false;
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    sinon.assert.notCalled(mockInstance.restart);
  });

  it('saves changes and restarts', function () {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.saveChanges();
    expect($elScope.saving).to.be.true;
    // Timeout
    $timeout.flush();
    expect($elScope.saving).to.be.false;
    // Update models and file updates were called
    sinon.assert.called(mockOpenItems.models[0].actions.saveChanges);
    // No restart on save
    sinon.assert.called(mockInstance.restart);
  });

  it('throws an error on a bad update', function () {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.openItems = {
      models : [genModel('a', 'b', true)]
    };
    $scope.$digest();
    $elScope.saveChanges();
    $scope.$digest();
    sinon.assert.called($elScope.openItems.models[0].actions.saveChanges);
    sinon.assert.calledWith(ctx.errsMock.handler, error);
  });

  it('throws an error on a bad restart', function () {
    $elScope.popoverSaveOptions.data.restartOnSave = true;
    $elScope.instance = {
      restart: sinon.stub().returns($q.reject(error))
    };
    $scope.$digest();
    $elScope.saveChanges();
    $scope.$digest();
    sinon.assert.calledOnce($elScope.instance.restart);
    sinon.assert.calledWith(ctx.errsMock.handler, error);
  });
  describe('popoverStatusOptions', function () {
    describe('actions', function () {
      it('should allow the user to stop the instance', function () {
        $elScope.popoverStatusOptions.actions.stopInstance();
        $elScope.$digest();
        sinon.assert.calledOnce($scope.instance.stop);
      });
      it('should allow the user to start the instance', function () {
        $elScope.popoverStatusOptions.actions.startInstance();
        $elScope.$digest();
        sinon.assert.calledOnce($scope.instance.start);
      });
      it('should allow the user to restart the instance', function () {
        $elScope.popoverStatusOptions.actions.restartInstance();
        $elScope.$digest();
        sinon.assert.calledOnce($scope.instance.restart);
      });

      it('should allow the user to build without cache', function () {
        $elScope.popoverStatusOptions.actions.rebuildWithoutCache();
        $elScope.$digest();
        sinon.assert.calledOnce($elScope.instance.build.deepCopy);
        sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
      });
      it('should allow the user to update the configuration to match master', function () {

        var mainAcv = {
          args: {
            thisIsAttrs: true
          },
          update: sinon.spy()
        };
        var copiedCtxVersion = {
          fetch: sinon.spy(),
          getMainAppCodeVersion: sinon.stub().returns(mainAcv)
        };
        var masterInstanceDeepCopy = {
          contextVersions: {
            models: [copiedCtxVersion]
          },
          fetch: sinon.spy()
        };
        var masterInstance = {
          attrs: {
            env: 'env'
          },
          build: {
            deepCopy: sinon.stub().returns(masterInstanceDeepCopy)
          }
        };
        $elScope.instance.fetchMasterPod = sinon.stub().returns({models: [masterInstance]});
        $elScope.$digest();
        $elScope.popoverStatusOptions.actions.updateConfigToMatchMaster();
        $elScope.$digest();

        sinon.assert.calledOnce(mainAcv.update);
        sinon.assert.calledWith(mainAcv.update, mockMainACV.attrs);
        sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
        sinon.assert.calledWith(mockUpdateInstanceWithNewBuild, $scope.instance, masterInstanceDeepCopy, true, { env: 'env' });
      });

    });
  });

  it('should show the instance as busy if its starting', function () {
    $scope.instance.status = sinon.stub().returns('starting');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as busy if its stopping', function () {
    $scope.instance.status = sinon.stub().returns('stopping');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as busy if its building', function () {
    $scope.instance.status = sinon.stub().returns('building');
    expect($elScope.isChanging()).to.be.true;
    sinon.assert.calledOnce($scope.instance.status);
  });

  it('should show the instance as not busy if its Started', function () {
    $scope.instance.status = sinon.stub().returns('started');
    expect($elScope.isChanging()).to.be.false;
    sinon.assert.calledOnce($scope.instance.status);
  });

});
