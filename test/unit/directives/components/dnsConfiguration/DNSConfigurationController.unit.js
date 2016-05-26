'use strict';

// injector-provided
var $scope;
var $controller;
var $elScope;
var $rootScope;
var instances = require('../../../apiMocks').instances;
var clone = require('101/clone');
var runnable = window.runnable;
var mockGetInstanceMaster = require('../../../fixtures/mockGetInstanceMaster');

describe('DNSConfigurationController'.bold.underline.blue, function() {
  var DCC;
  var promisifyMock;
  var mockDepedencies;
  var mockInstance;
  var mockMasterInstances;
  var mockIsolatedInstance;
  var getMatchingIsolatedInstanceReturnValue;

  function injectSetupCompile() {
    getMatchingIsolatedInstanceReturnValue = null;
    mockMasterInstances = runnable.newInstances(instances.list, {
      noStore: true
    });

    mockIsolatedInstance = runnable.newInstance(instances.isolated, {
      noStore: true
    });
    delete mockIsolatedInstance.contextVersion;

    mockMasterInstances.forEach(function (instance, index) {
      instance.attrs.contextVersion.context = 'TestContext' + index;
    });

    mockMasterInstances.models.forEach(function (instance, index) {
      var newInstances = [angular.copy(instances.running), angular.copy(instances.stopped)];
      newInstances[0]._id = 'NewInstance0-' + index;
      newInstances[1]._id = 'NewInstance1-' + index;
      newInstances[0].shortHash = index + 'abcde';
      newInstances[1].shortHash = index + 'fghij';

      var childInstances = runnable.newInstances(newInstances, {
        noStore: true
      });

      instance.contextVersion.getMainAppCodeVersion = sinon.stub().returns({});

      childInstances.models[0].attrs.name = 'ABCDE' + index;
      childInstances.models[1].attrs.name = 'FGHIJ' + index;
      childInstances.models.map(function (childInstance) {
        return angular.extend(childInstance, {
          contextVersion: {
            context: instance.attrs.contextVersion.context,
            getMainAppCodeVersion: sinon.stub().returns({})
          },
          parent: instance.attrs.shortHash,
          update: sinon.spy()
        });
      });

      instance.children = childInstances;
    });


    mockDepedencies = {
      models: [
        {
          instance: mockMasterInstances.models[0].children.models[0],
          update: sinon.spy()
        },
        {
          instance: mockMasterInstances.models[1],
          update: sinon.stub().returns(new Error('Error updating instance.'))
        }
      ]
    };

    angular.mock.module('app');
    angular.mock.module(function ($provide) {

      // Make debounce not actually do anything.
      $provide.value('debounce', sinon.spy(function (debouncedFunction) {
        return function () {
          debouncedFunction();
        };
      }));

      $provide.factory('getInstanceMaster', mockGetInstanceMaster(mockMasterInstances.models));
      $provide.factory('getMatchingIsolatedInstance', function () {
        return function () {
          return getMatchingIsolatedInstanceReturnValue;
        };
      });
      $provide.factory('isRepoContainerService', function (keypather) {
        return function (instance) {
          return keypather.get(instance, 'contextVersion.getMainAppCodeVersion()');
        };
      });
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$controller_
    ) {
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });


    var laterController = $controller('DNSConfigurationController', {
      $scope: $scope
    }, true);

    mockInstance = {
      fetchDependencies: sinon.stub().returns(mockDepedencies),
      on: sinon.spy(),
      off: sinon.spy(),
      isolation: {}
    };

    laterController.instance.instance = mockInstance;

    DCC = laterController();
  }

  describe('isolated', function () {
    beforeEach(function () {
      injectSetupCompile(true);
    });
    it('should fetch the isolation when the instance is part of an isolation', function () {
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.fetchDependencies);
      expect(DCC.filteredDependencies).to.deep.equal(mockDepedencies.models);
    });
    it('should put non repos in the nonRepoDeps array', function () {
      delete mockMasterInstances.models[0].children.models[0].contextVersion;
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.fetchDependencies);
      expect(DCC.nonRepoDependencies[0].instance).to.deep.equal(mockMasterInstances.models[0].children.models[0]);
    });
    describe('editDependency', function () {
      it('should be ok with getInstanceMaster not returning anything', function () {
        mockMasterInstances.models = [];
        $scope.$digest();
        var dep = {
          instance: mockIsolatedInstance
        };
        getMatchingIsolatedInstanceReturnValue = mockIsolatedInstance;
        DCC.editDependency(dep);
        expect($rootScope.isLoaded.dnsDepData).to.not.be.ok;
        $scope.$digest();
        expect(DCC.lastModifiedDNS).to.not.be.ok;
        expect(DCC.modifyingDNS.current).to.equal(dep);
        expect(DCC.modifyingDNS.options[0]).to.equal(mockIsolatedInstance);
        expect(DCC.modifyingDNS.options.length).to.equal(1);
      });
      it('should put the isolated fetch dependencies instances', function () {
        $scope.$digest();
        var dep = {
          instance: mockMasterInstances.models[0]
        };
        getMatchingIsolatedInstanceReturnValue = mockIsolatedInstance;
        DCC.editDependency(dep);
        expect($rootScope.isLoaded.dnsDepData).to.not.be.ok;
        $scope.$digest();
        expect(DCC.lastModifiedDNS).to.not.be.ok;
        expect(DCC.modifyingDNS.current).to.equal(dep);
        expect(DCC.modifyingDNS.options[0]).to.equal(mockIsolatedInstance);
        expect(DCC.modifyingDNS.options).to.contain(dep.instance);
        expect(DCC.modifyingDNS.options).to.contain(mockMasterInstances.models[0].children.models[0]);
        expect($rootScope.isLoaded.dnsDepData).to.be.ok;
      });
    });
  });
  describe('not isolated', function () {
    beforeEach(function () {
      injectSetupCompile();
    });

    it('should fetch the DNS configuration and listen to update events', function () {
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.on);
      expect(DCC.filteredDependencies).to.deep.equal(mockDepedencies.models);
      expect($rootScope.isLoaded.dns).to.be.ok;
    });
    it('should unlisten to instance update events on destroy', function () {
      $scope.$emit('$destroy');
      $scope.$digest();
      sinon.assert.calledOnce(mockInstance.off);
    });
    it('should handle destroy events from instances and trigger a refresh', function () {
      mockDepedencies.models[1].instance.on = sinon.spy();
      $scope.$digest();
      mockDepedencies.models[1].instance.on.lastCall.args[1]();
      $scope.$digest();
      sinon.assert.calledTwice(mockInstance.fetchDependencies);
    });

    describe('editDependency', function () {
      it('should fetch dependencies instances', function () {
        $scope.$digest();
        var dep = {
          instance: mockMasterInstances.models[0]
        };

        DCC.editDependency(dep);
        expect($rootScope.isLoaded.dnsDepData).to.not.be.ok;
        $scope.$digest();
        expect(DCC.lastModifiedDNS).to.not.be.ok;
        expect(DCC.modifyingDNS.current).to.equal(dep);
        expect(DCC.modifyingDNS.options).to.contain(dep.instance);
        expect(DCC.modifyingDNS.options).to.contain(mockMasterInstances.models[0].children.models[0]);
        expect($rootScope.isLoaded.dnsDepData).to.be.ok;
      });
    });

    describe('selectInstance', function () {
      it('should update the dependency to select the right instance', function () {
        $scope.$digest();
        var currentDNS = {
          update: sinon.spy()
        };
        DCC.modifyingDNS = {
          current: currentDNS
        };

        var instance = {
          getElasticHostname: sinon.stub().returns('elasticHostname'),
          attrs: {
            shortHash: '1234'
          }
        };

        DCC.selectInstance(instance);

        sinon.assert.calledOnce(currentDNS.update);
        expect(currentDNS.update.lastCall.args[0].hostname).to.equal('elasticHostname');
        expect(currentDNS.update.lastCall.args[0].instance).to.equal('1234');
      });
    });
  });

});