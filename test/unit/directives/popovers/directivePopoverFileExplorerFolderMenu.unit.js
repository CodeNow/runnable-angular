'use strict';

// injector-provided
var
  $compile,
  $state,
  $rootScope,
  $document,
  $scope;
var $elScope;

describe('directivePopoverFileExplorerFolderMenu'.bold.underline.blue, function() {
  var ctx, errs;

  describe('Functionality', function() {
    var element;
    var createFsMock;

    function injectSetupCompile () {
      ctx = {};
      createFsMock = sinon.spy();
      createFsMock.foo = Math.random();

      errs = {
        handler: sinon.spy()
      };
      angular.mock.module('app');
      angular.mock.module(function($provide) {
        $provide.factory('helperCreateFS', function(){
          return createFsMock;
        });
        $provide.value('errs', errs);
      });

      angular.mock.inject(function (
        _$rootScope_,
        _$compile_,
        _$document_
      ) {
        $scope = _$rootScope_.$new();
        $compile = _$compile_;
        $document = _$document_;
      });

      // Emitting contextmenu messes with our scope, we need to set things AFTER it's been added to the page.
      $scope.readOnly = false;
      $scope.dir = {
        attrs: {
          name: '/foo'
        },
        destroy: sinon.spy(),
        rename: sinon.spy()
      };

      ctx.template = '<div popover-file-explorer-folder-menu><input class="tree-input"></div>';
      ctx.element = $compile(ctx.template)($scope);
      $elScope = ctx.element.isolateScope();

      $scope.$digest();

      var event = $document[0].createEvent('HTMLEvents');
      event.initEvent('contextmenu', true, false);
      event.pageY = 0;
      event.pageX = 0;
      event.currentTarget = 12;
      event.target = 12;
      ctx.element[0].dispatchEvent(event);

      // We need to digest because this is a user event, a click happened which triggers
      //    a digest internally. It doesn't when we are in tests!
      $scope.$digest();
      element = $scope.$popoverTemplate[0];
    }

    beforeEach(function () {
      injectSetupCompile();
    });

    it('should show new file', function() {
      var newFileElement = element.querySelector('.popover-list-item:nth-child(1)');
      expect(newFileElement.innerText).to.equal('New File')
    });

    it('should trigger the new file action when clicked on new file', function() {
      var newFileElement = element.querySelector('.popover-list-item:nth-child(1)');
      window.helpers.click(newFileElement);
      expect(createFsMock.lastCall.args[1].isDir).to.equal(false);
    });

    it('should show new folder', function() {
      var newFolderElement = element.querySelector('.popover-list-item:nth-child(2)');
      expect(newFolderElement.innerText).to.equal('New Folder')
    });

    it('should trigger the new folder action when clicked on new folder', function() {
      var newFolderElement = element.querySelector('.popover-list-item:nth-child(2)');
      window.helpers.click(newFolderElement);
      expect(createFsMock.lastCall.args[1].isDir).to.equal(true);
    });

    it('should show rename', function() {
      var renameElement = element.querySelector('.popover-list-item:nth-child(4)');
      expect(renameElement.innerText).to.equal('Rename');
    });

    it('should trigger the rename action when clicked on rename and should handle close rename', function() {
      var renameElement = element.querySelector('.popover-list-item:nth-child(4)');
      window.helpers.click(renameElement);
      expect($scope.dirItemData.editFolderName).to.equal(true);
      $scope.dirItemData.actions.closeFolderNameInput();
      $scope.dir.attrs.name = "Foo";
      expect($scope.dir.rename.calledOnce).to.equal(true);
      expect($scope.dirItemData.editFolderName).to.equal(false);
    });

    it('should show delete', function() {
      var deleteElement = element.querySelector('.popover-list-item:nth-child(5)');
      expect(deleteElement.innerText).to.equal('Delete')
    });

    it('should trigger the delete action when clicked on delete', function() {
      var deleteElement = element.querySelector('.popover-list-item:nth-child(5)');
      window.helpers.click(deleteElement);
      expect($scope.dir.destroy.calledOnce).to.equal(true)
    });

    it('should close when the document is clicked', function(){
      $scope.$emit('app-document-click');
      expect($document[0].querySelector('.context-menu')).to.equal.null;
    });

    it('should close when another file modal is shown', function(){
      $scope.$emit('file-modal-open');
      expect($document[0].querySelector('.context-menu')).to.equal.null;
    });

    it('should not show if the tree is read only', function() {
      expect(element).to.equal.null;
    });

    it('should cleanup it\'s event handlers on destroy', function() {
      ctx.element[0].removeEventListener = sinon.spy();
      $scope.$emit('$destroy');
      expect(ctx.element[0].removeEventListener.calledOnce).to.equal(true);
    });

  });

});
