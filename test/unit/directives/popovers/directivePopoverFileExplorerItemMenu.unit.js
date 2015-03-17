'use strict';

// injector-provided
var
  $compile,
  $state,
  $rootScope,
  $document,
  $scope;
var $elScope;

describe('directivePopoverFileExplorerItemMenu'.bold.underline.blue, function() {
  var ctx, errs;

  describe('Functionality', function() {
    var element;

    errs = {
      handler: sinon.spy()
    };

    function injectSetupCompile () {
      ctx = {};
      angular.mock.module('app');
      angular.mock.module(function($provide) {
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
      $scope.openItems = {
        add: sinon.stub()
      };
      $scope.actions = {
        fetchDirFiles: sinon.stub()
      };
      $scope.fs = {
        attrs:{
          name: 'Test'
        },
        state:{
          open: true,
          renaming: false
        },
        destroy: sinon.stub().callsArg(0),
        rename: sinon.stub().callsArg(1)
      };


      ctx.template = '<div popover-file-explorer-item-menu><input class="tree-input"></div>';
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


    it('should show open', function() {
      var renameElement = element.querySelector('.popover-list-item:nth-child(1)');
      expect(renameElement.innerText).to.equal('Open');
    });

    it('should trigger the open action when clicked on open', function() {
      var openElement = element.querySelector('.popover-list-item:nth-child(1)');
      window.helpers.click(openElement);
      expect($scope.openItems.add.calledOnce).to.equal(true)
    });


    it('should show rename', function() {
      var renameElement = element.querySelector('.popover-list-item:nth-child(3)');
      expect(renameElement.innerText).to.equal('Rename');
    });

    it('should trigger the rename action when clicked on rename and should handle close rename', function() {
      var renameElement = element.querySelector('.popover-list-item:nth-child(3)');
      window.helpers.click(renameElement);
      expect($scope.fs.state.renaming).to.equal(true);
      $scope.fileItemData.actions.closeFileNameInput();
      $scope.fs.attrs.name = 'Test 1234';
      expect($scope.fs.rename.calledOnce, 'fs.rename called').to.equal(true);
      expect($scope.fs.state.renaming, 'renaming got set to false').to.equal(false);
    });

    it('should show delete', function() {
      var deleteElement = element.querySelector('.popover-list-item:nth-child(4)');
      expect(deleteElement.innerText).to.equal('Delete')
    });

    it('should trigger the delete action when clicked on delete', function() {
      var deleteElement = element.querySelector('.popover-list-item:nth-child(4)');
      window.helpers.click(deleteElement);
      expect($scope.fs.destroy.calledOnce).to.equal(true);
      expect($scope.actions.fetchDirFiles.calledOnce, 'fetch dir files called').to.equal(true);
    });

    it('should close when the document is clicked', function(){
      $scope.$emit('app-document-click');
      expect($document[0].querySelector('.context-menu')).to.equal.null;
    });

    it('should close when another file modal is shown', function(){
      $scope.$emit('file-modal-open');
      expect($document[0].querySelector('.context-menu')).to.equal.null;
    });

    it('should cleanup it\'s event handlers on destroy', function() {
      ctx.element[0].removeEventListener = sinon.spy();
      $scope.$emit('$destroy');
      expect(ctx.element[0].removeEventListener.calledOnce).to.equal(true);
    });

  });

});
