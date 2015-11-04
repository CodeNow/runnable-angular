'use strict';

describe('directiveExplorer'.bold.underline.blue, function () {
  var ctx;

  var $scope,
      $elScope,
      createFsMock,
      errs;


  beforeEach(function() {
    createFsMock = sinon.spy();
    errs = {
      handler: sinon.spy()
    };
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('helperCreateFS', createFsMock);
      $provide.value('errs', errs);
    });

    angular.mock.inject(function($compile, $rootScope) {
      $scope = $rootScope.$new();

      $scope.openItems = {};
      $scope.toggleTheme = true;
      $scope.rootDir = {
        contents: {
          fetch: sinon.spy()
        }
      };
      $scope.title = 'Hello';

      ctx = {};
      ctx.template = directiveTemplate.attribute('explorer', {
        'open-items': 'openItems',
        'root-dir': 'rootDir',
        'explorer-title': 'title',
        'toggle-theme': 'toggleTheme'
      });
      ctx.element = $compile(ctx.template)($scope);
    });
  });

  it('Check the scope', function() {
    $scope.$digest();
    $elScope = ctx.element.isolateScope();

    expect($elScope.openItems).to.be.ok;
    expect($elScope.toggleTheme).to.be.ok;
    expect($elScope.rootDir).to.be.ok;
    expect($elScope.explorerTitle).to.be.ok;


    expect($elScope.filePopover).to.be.ok;
    expect($elScope.filePopover.data).to.be.ok;
    expect($elScope.filePopover.data.show).to.be.false;
    $scope.$digest();

    expect($elScope.rootDir.state.open).to.be.true;

  });
});
