'use strict';

describe('directiveFileEditor'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $elScope;
  var $rootScope;
  var apiMocks = require('../apiMocks/index');
  var getModeForPathSpy;
  var setModeSpy;
  var fileMock = {
    attrs: apiMocks.files.dockerfile,
    fetch: null,
    update: null
  };
  var fileUpdateCb;
  var fileFetchCb;
  var editorMock = {};


  function initState(addFileToScope, autoUpdate) {
    var updatedBody = null;
    fileMock.fetch = sinon.spy(function (cb) {
      if (updatedBody !== null) {
        fileMock.attrs.body = updatedBody;
        updatedBody = null;
      }
      fileFetchCb = cb;
    });
    fileMock.update = sinon.spy(function (opts, cb) {
      fileUpdateCb = cb;
      updatedBody = opts.json.body;
    });

    setModeSpy = sinon.spy(function (mode) {
    });
    editorMock = {
      getSession: function () {
        return {
          setMode: setModeSpy
        };
      }
    };
    getModeForPathSpy = sinon.spy(function (name) {
      return {
        mode: 'hello'
      };
    });
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('modelist', {
        getModeForPath: getModeForPathSpy
      });
      $provide.value('debounce', function (fn) {
        return fn;
      });
    });
    angular.mock.inject(function ($compile, _$rootScope_) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();

      var attrs = {
        'file': 'file'
      };
      if (autoUpdate) {
        attrs['use-auto-update'] = 'true';
      }
      var tpl = directiveTemplate.attribute('file-editor', attrs);

      if (addFileToScope) {
        $scope.file = fileMock;
      }

      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }

  describe('basic'.bold.blue, function () {
    it('Should add stuff to the scope', function () {
      initState(true);
      $scope.$digest();

      expect($elScope.colorScheme, 'colorScheme').to.be.ok;
      expect($elScope.actions, 'actions').to.be.ok;
      expect($elScope.actions.setAceMode, 'setAceMode').to.be.ok;
      expect($elScope.actions.onFocus, 'onFocus').to.be.ok;
    });

    it('Should attempt to fetch the file immediately if it has one', function () {
      initState(true);
      expect($elScope.loading, 'loading').to.be.true;
      sinon.assert.calledOnce(fileMock.fetch);
      $scope.$apply();
      fileFetchCb();
      $scope.$apply();
      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.not.be.ok;

      expect(fileMock.state.body, 'fileMock.state.body').to.be.ok;
      expect(fileMock.state, 'fileMock.state').to.equal($elScope.file.state);
      expect($elScope.loading, 'loading').to.be.false;
      sinon.assert.notCalled(fileMock.update);
    });

    it('Should attempt to fetch the file once it appears on the scope', function () {
      initState();
      sinon.assert.notCalled(fileMock.fetch);
      $scope.file = fileMock;
      $scope.$apply();
      sinon.assert.calledOnce(fileMock.fetch);
      $scope.$apply();
      expect($elScope.loading, 'loading').to.be.true;
      fileFetchCb();
      $scope.$apply();

      expect(fileMock.state, 'fileMock.state.body').to.be.ok;
      expect(fileMock.state, 'fileMock.state').to.equal($elScope.file.state);
      expect($elScope.loading, 'loading').to.be.false;
      sinon.assert.notCalled(fileMock.update);
    });
  });

  describe('actions'.bold.blue, function () {
    it('Should wait for the file to set the ace mode', function () {
      initState();
      var onFocusSpy = sinon.spy();
      $rootScope.$on('app-document-click', onFocusSpy);

      $elScope.actions.onFocus();
      sinon.assert.calledOnce(onFocusSpy);

      // setAceMode will have already been called by the ace editor because o
      // the view, so reset them
      sinon.assert.notCalled(getModeForPathSpy);
      sinon.assert.notCalled(setModeSpy);

      $scope.file = fileMock;
      $scope.$apply();
      fileFetchCb();
      $scope.$apply();
      getModeForPathSpy.reset();
      setModeSpy.reset();

      $elScope.actions.setAceMode(editorMock);
      $scope.$apply();

      sinon.assert.calledWith(getModeForPathSpy, fileMock.attrs.name);
      sinon.assert.calledWith(setModeSpy, 'hello');
    });
  });
  describe('updating'.bold.blue, function () {

    it('Should autoupdate when flag is set', function () {
      initState(true, true);
      fileFetchCb();
      $scope.$apply();

      fileMock.state.body = '';
      $scope.$apply();

      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.be.ok;
      $scope.$apply();
      sinon.assert.calledOnce(fileMock.update);
      sinon.assert.calledWith(fileMock.update, {
        json: {
          body: ''
        }
      });
      fileUpdateCb();
      $scope.$apply();
      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.not.be.ok;
    });

    it('Should not set !isDirty after an outdated update returns', function () {
      initState(true, true);
      fileFetchCb();
      $scope.$apply();

      fileMock.state.body = '';
      $scope.$apply();

      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.be.ok;
      $scope.$apply();
      sinon.assert.calledOnce(fileMock.update);
      sinon.assert.calledWith(fileMock.update, {
        json: {
          body: ''
        }
      });
      fileMock.state.body = 'asdfadsfdsfadsfas';
      fileUpdateCb();
      $scope.$apply();
      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.be.ok;
      $scope.$apply();
      fileUpdateCb();
      $scope.$apply();
      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.not.be.ok;
    });

    it('Should not autoupdate when flag is set to false', function () {
      initState(true);
      fileFetchCb();
      $scope.$apply();

      fileMock.state.body = '';
      $scope.$apply();
      sinon.assert.notCalled(fileMock.update);
    });


    it('Should update after receiving an event over the scope', function () {
      initState(true);
      fileFetchCb();
      $scope.$apply();

      fileMock.state.body = '';
      $scope.$apply();
      sinon.assert.notCalled(fileMock.update);

      $scope.$broadcast('EDITOR::SAVE', true);
      $scope.$apply();
      sinon.assert.calledOnce(fileMock.update);
      sinon.assert.calledWith(fileMock.update, {
        json: {
          body: ''
        }
      });
      fileUpdateCb();
      $scope.$apply();
      expect(fileMock.state.isDirty, 'fileMock.state.isDirty').to.not.be.ok;
    });

  });
});
