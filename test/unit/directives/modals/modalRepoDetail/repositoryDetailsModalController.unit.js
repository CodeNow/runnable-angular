'use strict';

describe.only('RepositoryDetailsModalController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var keypather;
  var $elScope;
  var $controller;
  var $q;
  var controller;

  var fetchCommitDataStub;
  var ModalServiceStub;
  var modalCloseStub;
  var updateInstanceWithNewAcvDataStub;

  var instance;
  var repo = 'helllo/World';
  var branch = 'superBranch';
  var acv;
  var closeStub;

  function initialize() {
    acv = {
      attrs: {
        repo: repo,
        branch: branch,
        useLatest: false
      }
    };
    instance = {
      contextVersion: {
        getMainAppCodeVersion: sinon.stub().returns(acv),
      },
      update: sinon.spy(function (name, cb) {
        return instance;
      }),
      attrs: {
        locked: false
      },
      isolation: null
    };
    closeStub = sinon.stub();
  }
  function initState() {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchCommitData', function ($q) {
        fetchCommitDataStub = {
          activeBranch: sinon.stub().returns({}),
          activeCommit: sinon.stub().returns($q.when(true))
        };
        return fetchCommitDataStub;
      });
      $provide.value('close', closeStub);
      $provide.factory('ModalService', function ($q) {
        var modalCloseStub = {
          close: $q.when(true)
        };
        ModalServiceStub  = {
          showModal: sinon.stub().returns($q.when(modalCloseStub))
        };
        return ModalServiceStub;
      });
      $provide.factory('updateInstanceWithNewAcvData', function ($q) {
        updateInstanceWithNewAcvDataStub = sinon.stub().returns($q.when(true));
        return updateInstanceWithNewAcvDataStub;
      });
      $provide.factory('promisify', function ($q) {
        return function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(this, arguments));
          };
        };
      });
    });

    angular.mock.inject(function (
      $compile,
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      $scope = $rootScope.$new();

      $scope.data = {};

      controller = $controller('RepositoryDetailsModalController', {
        $scope: $scope,
        acv: acv,
        instance: instance,
      });
      $scope.$digest();
    });
  }
  beforeEach(function () {
    initialize();
  });
  describe('Init', function () {
    beforeEach(function () {
      initState();
    });
    it('fetch the commit', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchCommitDataStub.activeCommit);
      sinon.assert.calledWith(fetchCommitDataStub.activeCommit, acv);
    });
  });

  describe('confirmAutoDeploy', function () {
    beforeEach(function () {
      initState();
    });
    it('show the modal and return the response', function () {
      controller.confirmAutoDeploy()
        .then(function (confirmed) {
          expect(confirmed).to.equal(true);
        });
      $scope.$digest();
      sinon.assert.calledOnce(ModalServiceStub.showModal);
      sinon.assert.calledWithExactly(ModalServiceStub.showModal, {
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'confirmSyncModalView',
      });
    });
  });

  describe('updateInstance', function () {
    var generateIsolation = function (repo, branch) {
      return {
        instances: {
          models: [
            instance,
            {
              contextVersion: {
                getMainAppCodeVersion: sinon.stub().returns({
                  attrs: { repo: repo, branch: branch }
                })
              }
            }
          ]
        }
      };
    };

    beforeEach(function () {
      initState();
    });

    describe('Confirmation', function () {
      it('should update insance without confirmation if not in isolation', function () {
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
        sinon.assert.notCalled(controller.confirmAutoDeploy);
        sinon.assert.calledOnce(updateInstanceWithNewAcvDataStub);
        sinon.assert.calledWithExactly(
          updateInstanceWithNewAcvDataStub,
          instance,
          acv,
          controller.data
        );
      });

      it('should update insance without confirmation if no other instance has the same branch', function () {
        instance.isolation = generateIsolation(repo, 'someOtherBranch');
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
      });

      it('should update insance without confirmation if no other instance has the same repo', function () {
        instance.isolation = generateIsolation('somerOtherRepo', branch);
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
      });

      describe('Isolated Instances with same repo/branch', function () {
        it('should ask for confirmation if there are instances with same repo/branch', function () {
          instance.isolation = generateIsolation(repo, branch);
          sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

          controller.updateInstance();
          $scope.$digest();
          sinon.assert.calledOnce(controller.confirmAutoDeploy);
        });

        it('should not update the instance if not confirmed', function () {
          instance.isolation = generateIsolation(repo, branch);
          sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(false));

          controller.updateInstance();
          $scope.$digest();
          sinon.assert.calledOnce(controller.confirmAutoDeploy);
          sinon.assert.notCalled(updateInstanceWithNewAcvDataStub);
        });

        it('should update the instance if confirmed', function () {
          instance.isolation = generateIsolation(repo, branch);
          sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

          controller.updateInstance();
          $scope.$digest();
          sinon.assert.calledOnce(controller.confirmAutoDeploy);
          sinon.assert.calledOnce(updateInstanceWithNewAcvDataStub);
        });
      });
    });

    describe('`locked`', function () {
      it('should not set the `locked` property it hasnt changed', function () {
        controller.data.locked = true;
        controller.instance.attrs.locked = true;
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
        sinon.assert.notCalled(controller.instance.update);
      });

      it('should set the `locked` property to true it has changed', function () {
        controller.data.locked = true;
        controller.instance.attrs.locked = false;
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
        sinon.assert.calledOnce(controller.instance.update);
        sinon.assert.calledWithExactly(controller.instance.update, {
          locked: true
        });
      });

      it('should set the `locked` property to false it has changed', function () {
        controller.data.locked = false;
        controller.instance.attrs.locked = true;
        sinon.stub(controller, 'confirmAutoDeploy').returns($q.when(true));

        controller.updateInstance();
        $scope.$digest();
        sinon.assert.calledOnce(controller.instance.update);
        sinon.assert.calledWithExactly(controller.instance.update, {
          locked: false
        });
      });

    });
  });
});

