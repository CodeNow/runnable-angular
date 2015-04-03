'use strict';

describe('directiveActivePanel'.bold.underline.blue, function () {
  var ctx;
  var mockUpdateInstanceWithNewBuild;
  var $rootScope;
  var $q;

  var $scope,
      $elScope;

  var apiMocks = require('../apiMocks/index');
  function initState(attrs, scopeOptions) {
    scopeOptions = scopeOptions || {};
    attrs = attrs || {};

    angular.mock.module('app');
    angular.mock.module(function($provide) {

      $provide.value('updateInstanceWithNewBuild', mockUpdateInstanceWithNewBuild);

      $provide.factory('envVarsDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });

      $provide.factory('termDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });

      $provide.factory('logTermDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });
      $provide.factory('fileEditorDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });
    });

    angular.mock.inject(function(
      $compile,
      _$rootScope_,
      _$q_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      $scope = $rootScope.$new();

      $scope.openItems = {};
      $scope.instance = {
        attrs: apiMocks.instances.building
      };
      $scope.build = {
        attrs: apiMocks.builds.built
      };
      $scope.validation = {
        env: {}
      };
      $scope.stateModel = {
        env: {}
      };

      ctx = {};
      var theseAttrs = {
        'open-items': 'openItems',
        'instance': 'instance',
        'build': 'build',
        'validation': 'validation',
        'state-model': 'stateModel',
        'is-edit-modal': 'isEditModal'
      };
      Object.keys(attrs).forEach(function (key) {
        theseAttrs[key] = attrs[key];
      });

      Object.keys(scopeOptions).forEach(function (key) {
        $scope[key] = scopeOptions[key];
      });

      ctx.template = directiveTemplate.attribute('active-panel', theseAttrs);
      ctx.element = $compile(ctx.template)($scope);
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
    });
  }


  it('Check the scope', function () {
    initState({
      'use-auto-update': 'true'
    });
    expect($elScope.openItems, 'openItems').to.be.ok;
    expect($elScope.instance, 'instance').to.be.ok;
    expect($elScope.build, 'build').to.be.ok;
    expect($elScope.validation, 'validation').to.be.ok;
    expect($elScope.stateModel, 'stateModel').to.be.ok;
    expect($elScope.useAutoUpdate, 'useAutoUpdate').to.be.true;


    expect($elScope.openItems).to.equal($scope.openItems);
    expect($elScope.instance).to.equal($scope.instance);
    expect($elScope.build).to.equal($scope.build);
    expect($elScope.validation).to.equal($scope.validation);
    expect($elScope.stateModel).to.equal($scope.stateModel);

  });

  it('Making sure background buttons works properly', function () {
    initState({
      'background-buttons': 'web, build, server, term'
    });
    expect($elScope.showBackgroundButtons).to.deep.equal({
      web: true,
      build: true,
      server: true,
      term: true
    });
    expect($elScope.useAutoUpdate).to.be.false;
  });

  it('should hide build failure only when on the edit modal', function () {
    initState({}, {
      isEditModal: true,
      instance: {
        attrs: apiMocks.instances.building,
        build: {
          attrs: apiMocks.builds.failed
        }
      },
      openItems: {
        activeHistory: {
          models: [
            {
              state: {
                active: true,
                type: 'LogView'
              }
            },
            {
              state: {
                active: false,
                type: 'BuildStream'
              }
            }
          ]
        }
      }
    });
    var foo = $elScope.showBuildFailurePrompt();
    expect(foo).to.equal(false);
  });

  it('should show build failure only when on the edit modal', function () {
    initState({}, {
      isEditModal: false,
      instance: {
        attrs: apiMocks.instances.building,
        build: {
          attrs: apiMocks.builds.failed
        }
      },
      openItems: {
        activeHistory: {
          models: [
            {
              state: {
                active: false,
                type: 'LogView'
              }
            },
            {
              state: {
                active: true,
                type: 'BuildStream'
              }
            }
          ]
        }
      }
    });
    expect($elScope.showBuildFailurePrompt()).to.equal(true);
  });

  it('should only show build failure on the build stream page', function () {
    initState({}, {
      isEditModal: false,
      instance: {
        attrs: apiMocks.instances.building,
        build: {
          attrs: apiMocks.builds.failed
        }
      },
      openItems: {
        activeHistory: {
          models: [
            {
              state: {
                active: false,
                type: 'BuildStream'
              }
            },
            {
              state: {
                active: true,
                type: 'LogView'
              }
            }
          ]
        }
      }
    });
    expect($elScope.showBuildFailurePrompt()).to.equal(false);
  });

  it('should have a build without cache action', function () {
    mockUpdateInstanceWithNewBuild = sinon.stub();
    var deepCopy = sinon.stub().callsArg(0);
    initState({}, {
      isEditModal: false,
      instance: {
        attrs: apiMocks.instances.building,
        build: {
          attrs: apiMocks.builds.failed,
          deepCopy: deepCopy
        }
      },
      openItems: {
        activeHistory: {
          models: [
            {
              state: {
                active: true,
                type: 'LogView'
              }
            },
            {
              state: {
                active: false,
                type: 'BuildStream'
              }
            }
          ]
        }
      }
    });
    var deferred = $q.defer();
    mockUpdateInstanceWithNewBuild.returns(deferred.promise);

    $elScope.actions.buildWithoutCache();
    expect($rootScope.dataApp.data.loading, 'Loading on root scope').to.equal(true);
    expect(deepCopy.calledOnce, 'deep copy called').to.equal(true);
    $elScope.$digest();
    expect(mockUpdateInstanceWithNewBuild.calledOnce, 'Update Instance called').to.equal(true);

    deferred.resolve();
    $elScope.$digest();

    expect($rootScope.dataApp.data.loading, 'Loading on root scope').to.equal(false);
  });

  it('should have a hide build failure action', function () {
    initState({}, {
      isEditModal: false,
      instance: {
        attrs: apiMocks.instances.building,
        build: {
          attrs: apiMocks.builds.failed
        }
      },
      openItems: {
        activeHistory: {
          models: [
            {
              state: {
                active: false
              }
            },
            {
              state: {
                active: true,
                type: 'BuildStream'
              }
            }
          ]
        }
      }
    });
    expect($elScope.showBuildFailurePrompt()).to.equal(true);
    $elScope.actions.hideBuildFailurePrompt();
    expect($elScope.showBuildFailurePrompt()).to.equal(false);
  });

});