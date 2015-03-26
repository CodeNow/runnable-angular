'use strict';

describe('directiveActivePanel'.bold.underline.blue, function () {
  var ctx;

  var $scope,
      $elScope;

  var apiMocks = require('../apiMocks/index');
  function initState(attrs) {
    angular.mock.module('app');
    angular.mock.module(function($provide) {

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

    angular.mock.inject(function($compile, $rootScope) {
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
        'state-model': 'stateModel'
      };
      Object.keys(attrs).forEach(function (key) {
        theseAttrs[key] = attrs[key];
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

});