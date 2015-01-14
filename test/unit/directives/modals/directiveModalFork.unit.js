'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  updateEnvStub,
  getNewForkNameStub;
var $elScope;
var thisUser;

var apiMocks = require('../../apiMocks/index');

function makeDefaultScope () {
  return {
    data: {
      instance: {
        attrs: angular.copy(apiMocks.instances.building),
        fetch: sinon.spy()
      },
      instances: [
        {
          attrs: angular.copy(apiMocks.instances.building),
          fetch: sinon.spy()
        }, {
          attrs: angular.copy(apiMocks.instances.running),
          fetch: sinon.spy()
        }
      ]
    },
    actions: {
      forkInstance: sinon.spy()
    },
    defaultActions: {
      cancel: sinon.spy()
    }
  };
}

describe('directiveModalFork'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope) {
    updateEnvStub = sinon.spy();
    getNewForkNameStub = sinon.spy(function(instance) {
      return instance.attrs.name + '-new';
    });
    angular.mock.module('app', function ($provide) {
      $provide.value('updateEnvName', updateEnvStub);
      $provide.value('getNewForkName', getNewForkNameStub);
      $provide.value('linkedInstances', sinon.spy());
    });

    angular.mock.inject(function (
      _$compile_,
      _keypather_,
      _$timeout_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    ctx.template = directiveTemplate('modal-fork-box', {
      'data': 'data',
      'actions': 'actions',
      'default-actions': 'defaultActions'
    });
    var element = $compile(ctx.template)($scope);
    ctx.element = element;
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    return element;
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.data).to.be.ok;
      // Actions was modified, so just verify it exists
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.forkInstance).to.be.a('function');
      expect($elScope.defaultActions).to.be.ok;
      expect($elScope.defaultActions.cancel).to.be.a('function');

      sinon.assert.called(getNewForkNameStub);
      expect($elScope.data.forkDependencies).to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
  });

  /**
   * Things to test
   *
   * Forking an instance with no dependency
   * Instance with dependencies, not forking deps
   * with deps, forking
   * with deps, forking, then not forking
   * with deps (containing env with root instance), change root instance name
   * deps, root contains env with dep, change dep name, should affect root env
   *
   * check that closing the modal resets the opts
   *
   */
  describe('checking name changes', function () {
    var scope, element;
    beforeEach(function () {
      scope = makeDefaultScope();
      scope.data.instance.attrs.name = 'test1';
    });
    afterEach(function () {
      $rootScope.$destroy();
      $rootScope.$digest();
    });
    describe('without dependencies', function () {
      describe('without envs', function () {
        beforeEach(function () {
          injectSetupCompile(scope);
        });
        it('should start with the name being name-new, env button shouldn\'t show', function () {
          // Check the dom to see envs match to the attrs
          var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
          expect(envButtonElement).to.not.be.ok;
          sinon.assert.called(getNewForkNameStub);

          var forkNameElement = getRootInstanceElement();
          expect(forkNameElement.value).to.equal($scope.data.instance.attrs.name + '-new');

          expect($elScope.items[0].opts.name).to.equal('test1-new');

          $scope.actions.forkInstance = sinon.spy(function (items) {
            expect(items.length).to.equal(1);
            expect(items[0].opts.name).to.equal('test1-new');
            expect(items[0].opts.env).to.be.undefined;
          });
          // Now fork
          getForkButtonElement().click();
          sinon.assert.called($scope.defaultActions.cancel);

        });
      });
      describe('with envs', function () {
        beforeEach(function () {
          scope.data.instance.attrs.env = ['a=b', 'asdas=asdasd'];
          injectSetupCompile(scope);
        });
        it('should start with the name being name-new, env button should show', function () {
          var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
          expect(envButtonElement).to.be.ok;
          sinon.assert.called(getNewForkNameStub);

          var forkNameElement = getRootInstanceElement();
          expect(forkNameElement.value).to.equal($scope.data.instance.attrs.name + '-new');

          expect($elScope.items[0].opts.name).to.equal('test1-new');

          $scope.actions.forkInstance = sinon.spy(function (items) {
            expect(items.length).to.equal(1);
            expect(items[0].opts.name).to.equal('test1-new');
            expect(items[0].opts.env).to.equal($scope.data.instance.attrs.env);
          });
          // Now fork
          getForkButtonElement().click();
          sinon.assert.called($scope.defaultActions.cancel);
        });
      });
    });
    describe('with dependencies', function () {
      beforeEach(function () {
        scope.data.instance.dependencies = {
          models: [{
            attrs: {
              name: 'dep'
            },
            fetch: sinon.spy()
          }, {
            attrs: {
              name: 'dep2'
            },
            fetch: sinon.spy()
          }]
        };
      });
      describe('forking deps', function () {
        describe('without envs on root instance', function () {
          describe('without envs on dep instance', function () {
            beforeEach(function () {
              injectSetupCompile(scope);
              $scope.data.forkDependencies = true;
              $scope.$apply();

            });
            it('should change root and dep instance names', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList =
                [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });
              expect($elScope.items[0].opts.name).to.equal('test1-new');

              $scope.actions.forkInstance = sinon.spy(function (items) {
                expect(items.length).to.equal(combinedInstanceList.length);
                items.forEach(function (item, index) {
                  expect(item.opts.name).to.
                    equal(combinedInstanceList[index].attrs.name + '-new' );
                  expect(item.opts.env).to.be.undefined;
                });
              });
              // Now fork
              getForkButtonElement().click();
              sinon.assert.called($scope.defaultActions.cancel);
            });
          });
          describe('with envs on dep instance', function () {
            beforeEach(function () {
              scope.data.instance.dependencies.models.forEach(function (instance) {
                instance.attrs.env = ['asdad=asdasd'];
              });
              injectSetupCompile(scope);
              $scope.data.forkDependencies = true;
              $scope.$apply();
            });
            it('should set new names, and try to replace the envs of the deps', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList =
                [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });
              expect($elScope.items[0].opts.name).to.equal('test1-new');

              $scope.actions.forkInstance = sinon.spy(function (items) {
                expect(items.length).to.equal(combinedInstanceList.length);
                items.forEach(function (item, index) {
                  expect(item.opts.name).to.
                    equal(combinedInstanceList[index].attrs.name + '-new' );
                  if (index === 0) {
                    expect(item.opts.env).to.be.undefined;
                  } else {
                    expect(item.opts.env).to.equal(combinedInstanceList[index].attrs.env);
                  }
                });
              });
              // Now fork
              getForkButtonElement().click();
            });
            it('should try to update all envs when all names change', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList = [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              $elScope.items.forEach(function (item, idx) {
                item.opts.name = 'evenNewerName' + idx;
              });
              $scope.$apply();
              combinedInstanceList.forEach(function (instance, idx) {
                var newName = 'evenNewerName' + idx;
                expect(depNameElementList[idx].value).to.equal(newName);

                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              expect($elScope.items[0].opts.name).to.equal('evenNewerName0');
            });
            it('should try to update all envs when all names change', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList = [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.called(updateEnvStub);
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              $elScope.items.forEach(function (item, idx) {
                item.opts.name = 'evenNewerName' + idx;
              });
              $scope.$apply();
              combinedInstanceList.forEach(function (instance, idx) {
                var newName = 'evenNewerName' + idx;
                expect(depNameElementList[idx].value).to.equal(newName);

                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              expect($elScope.items[0].opts.name).to.equal('evenNewerName0');
            });

            it('should reset the state.envs of everything when the window is reopened', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList = [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              $elScope.items.forEach(function (item, idx) {
                item.opts.name = 'evenNewerName' + idx;
              });
              $scope.$apply();
              combinedInstanceList.forEach(function (instance, idx) {
                var newName = 'evenNewerName' + idx;
                expect(depNameElementList[idx].value).to.equal(newName);

                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });

              expect($elScope.items[0].opts.name).to.equal('evenNewerName0');

              $scope.$destroy();
              combinedInstanceList.forEach(function (instance) {
                expect(instance.state).to.be.undefined;
              });
              expect($scope.items).to.be.undefined;

            });
          });
        });
        describe('with envs on root instance', function () {
          beforeEach(function () {
            scope.data.instance.attrs.env = ['a=b', 'asdas=asdasd'];
          });
          describe('without envs on dep instance', function () {
            beforeEach(function () {
              injectSetupCompile(scope);
              $scope.data.forkDependencies = true;
              $scope.$apply();

            });
            it('should change root and dep instance names', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList = [$scope.data.instance].concat($scope.data.instance.dependencies.models);


              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });
              expect($elScope.items[0].opts.name).to.equal('test1-new');
            });
          });
          describe('with envs on dep instance', function () {
            beforeEach(function () {
              scope.data.instance.dependencies.models.forEach(function (instance) {
                instance.attrs.env = ['asdad=' + scope.data.instance.attrs.name];
              });
              injectSetupCompile(scope);
              $scope.data.forkDependencies = true;
              $scope.$apply();
            });
            it('should set new names, and try to replace the envs of the deps', function () {
              var envButtonElement = ctx.element[0].querySelector('.btn-popover-wrapper');
              //expect(envButtonElement).to.not.be.ok;
              sinon.assert.called(getNewForkNameStub);

              var combinedInstanceList = [$scope.data.instance].concat($scope.data.instance.dependencies.models);

              var depNameElementList = getDepInstanceNameInputList();
              combinedInstanceList.forEach(function (instance, idx) {
                expect(depNameElementList[idx].value).to.equal(instance.attrs.name + '-new');
                sinon.assert.calledWith(getNewForkNameStub, instance, $scope.data.instances);
              });
              expect($elScope.items[0].opts.name).to.equal('test1-new');
            });
          });
        });
      });
    });
  });
  function getRootInstanceElement() {
    return ctx.element[0]
      .querySelector('label.input-group.input-validate.with-description > input.input');
  }
  function getDepInstanceNameInputList() {
    return ctx.element[0]
      .querySelectorAll('input.input');
  }

  function getForkButtonElement() {
    return ctx.element[0]
      .querySelector('button.btn.green');
  }

});

