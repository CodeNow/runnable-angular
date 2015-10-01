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

  function injectSetupCompile () {
    mockMasterInstances = runnable.newInstances(instances.list, {
      noStore: true
    });

    mockMasterInstances.forEach(function (instance, index) {
      instance.attrs.contextVersion.context = 'TestContext' + index;
    });

    mockMasterInstances.models.forEach(function (instance, index) {
      var newInstances = [angular.copy(instances.running), angular.copy(instances.stopped)];
      newInstances[0]._id = 'NewInstance0-'+index;
      newInstances[1]._id = 'NewInstance1-'+index;
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
      $provide.factory('getInstanceMaster', mockGetInstanceMaster(mockMasterInstances.models));
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
      fetchDependencies: sinon.stub().returns(mockDepedencies)
    };

    laterController.instance.instance = mockInstance;

    DCC = laterController();
  }

  beforeEach(injectSetupCompile);

  it('should fetch the DNS configuration', function () {
    $scope.$digest();
    expect(DCC.dependencies).to.equal(mockDepedencies);
    expect($rootScope.isLoaded.dns).to.be.ok;
  });

  describe('getWorstStatusClass', function () {
    beforeEach(function () {
      mockDepedencies.models.forEach(function (dep) {
        dep.instance.status = sinon.stub().returns('running');
      });
    });

    it('should return nothing if all containers are running', function () {
      $scope.$digest();
      expect(DCC.getWorstStatusClass()).to.not.be.ok;
    });

    it('should return red when there is a crashed container and a starting container', function () {
      $scope.$digest();
      mockDepedencies.models[0].instance.status.returns('crashed');
      mockDepedencies.models[1].instance.status.returns('starting');
      expect(DCC.getWorstStatusClass()).to.equal('red');
    });

    it('should return orange when there is a starting container', function () {
      $scope.$digest();
      mockDepedencies.models[0].instance.status.returns('starting');
      expect(DCC.getWorstStatusClass()).to.equal('orange');
    });

    it('should short circuit if deps havent yet loaded', function () {
      expect(DCC.getWorstStatusClass()).to.not.be.ok;
    });
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