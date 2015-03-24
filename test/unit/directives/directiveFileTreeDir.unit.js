'use strict';
// This wasn't testing anything useful anyway
describe.skip('directiveFileTreeDir'.bold.underline.blue, function () {
  var $scope;
  var createFsMock;
  var mockDir = {};
  var mockOpenItems = {};
  var ctx;
  var $compile;
  var inputElement;
  var $elScope;
  var errs;

  function injectSetupCompile() {
    ctx = {};
    errs = {
      handler: sinon.spy()
    };
    createFsMock = sinon.spy();
    createFsMock.foo = Math.random();
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('helperCreateFS', function () {
        return createFsMock;
      });
      $provide.value('errs', errs);
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$compile_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
    });
    $scope.mockDir = mockDir;
    $scope.mockOpenItems = mockOpenItems;

    ctx.template = directiveTemplate('file-tree-dir', {
      'dir': 'mockDir',
      'open-items': 'mockOpenItems',
      'read-only': 'true'
    });

    ctx.element = $compile(ctx.template)($scope);
    console.log(ctx.template);
    console.log(ctx.element);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    console.log($elScope);

    inputElement = ctx.element[0].querySelector('input.tree-input');
  }
  beforeEach(function () {
    injectSetupCompile();
  });

  it('should handle changing the folder name', function () {
    $elScope.editFolderName = true;
    $elScope.dir.attrs.name = 'foo';
    $elScope.dir.rename = sinon.spy();
    inputElement.value = '123';
    $scope.actions.closeFolderNameInput();
    expect($elScope.dir.rename.calledOnce).to.equal(true);
    expect($elScope.dir.rename.calledWith('123', errs.handler)).to.equal(true);
  });
});
