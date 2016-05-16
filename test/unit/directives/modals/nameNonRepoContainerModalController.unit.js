/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('NameNonRepoContainerModalController'.bold.underline.blue, function () {
  var $scope;
  var MC;

  // Imported Values
  var $controller;
  var $rootScope;
  var keypather;

  // Mocks
  var sourceInstanceMock;
  var copiedSourceInstanceMock;
  var buildContainerMock;
  var instancesMock;
  var activeAccountMock;
  var nameMock;
  var isolationMock;
  var instanceToForkNameMock;

  // Stubs
  var closeStub;
  var closeModalStub;
  var showModalStub;
  var createAndBuildNewContainerStub;
  var copySourceInstanceStub;
  var fetchInstancesByPodStub;
  var errsStub;
  var eventTrackingStub;

  function setup(withIsolation) {
    nameMock = 'nameMock';
    isolationMock = undefined;
    if (withIsolation) {
      isolationMock = 'isolationMock';
    }
    instanceToForkNameMock = 'instanceToForkNameMock';
    sourceInstanceMock = {
      id: 'sourceInstanceMock'
    };
    copiedSourceInstanceMock = {
      id: 'copiedSourceInstanceMock'
    };
    buildContainerMock = {
      id: 'buildContainerMock'
    };
    instancesMock = [
      {
        attrs: {
          name: 'name1'
        }
      }
    ];
    activeAccountMock = {
      oauthName: sinon.mock().returns('myOauthName')
    };

    eventTrackingStub = {
      createdNonRepoContainer: sinon.stub()
    };

    errsStub = {
      handler: sinon.spy()
    };

    closeStub = sinon.stub();

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('errs', errsStub);
      $provide.value('eventTracking', eventTrackingStub);

      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instancesMock));
        return fetchInstancesByPodStub;
      });
      $provide.factory('createAndBuildNewContainer', function ($q) {
        createAndBuildNewContainerStub = sinon.stub().returns($q.when(buildContainerMock));
        return createAndBuildNewContainerStub;
      });

      $provide.factory('copySourceInstance', function ($q) {
        copySourceInstanceStub = sinon.stub().returns($q.when(copiedSourceInstanceMock));
        return copySourceInstanceStub;
      });

      $provide.factory('ModalService', function ($q) {
        closeModalStub = {
          close: $q.when(true)
        };
        showModalStub = sinon.spy(function () {
          return $q.when(closeModalStub);
        });
        return {
          showModal: showModalStub
        };
      });
      $provide.value('close', closeStub);
      $provide.value('sourceInstance', sourceInstanceMock);
      $provide.value('name', nameMock);
      $provide.value('isolation', isolationMock);
      $provide.value('instanceToForkName', instanceToForkNameMock);
      $provide.value('sourceInstance', sourceInstanceMock);
    });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;

      keypather.set($rootScope, 'dataApp.data.activeAccount', activeAccountMock);
      $scope = $rootScope.$new();

      MC = $controller('NameNonRepoContainerViewModalController', {
        $scope: $scope
      });
    });
  };

  describe('actions', function () {
    describe('save', function () {
      describe('with isolation', function () {
        beforeEach(function () {
          setup(true);
        });
        it('should create a non repo container with the right name', function () {
          MC.actions.save();
          $scope.$digest();
          sinon.assert.calledOnce(copySourceInstanceStub);
          sinon.assert.calledWith(copySourceInstanceStub, activeAccountMock, sourceInstanceMock, nameMock);

          sinon.assert.calledOnce(createAndBuildNewContainerStub);
          sinon.assert.calledWith(createAndBuildNewContainerStub, sinon.match.object, nameMock, { isolation: isolationMock });

          sinon.assert.calledOnce(closeStub);

          sinon.assert.calledOnce(eventTrackingStub.createdNonRepoContainer);
          sinon.assert.calledWith(eventTrackingStub.createdNonRepoContainer, instanceToForkNameMock);
        });
      });
      describe('without isolation', function () {
        beforeEach(function () {
          setup(false);
        });
        it('should create a non repo container in isolation', function () {
          MC.actions.save();
          $scope.$digest();
          sinon.assert.calledWith(createAndBuildNewContainerStub, sinon.match.object, nameMock, undefined);
        });
      });
    });
  });
});
