'use strict';

// injector-provided
var $scope;
var $elScope;
var $rootScope;
var $compile;
var instances = require('../../../apiMocks').instances;
var clone = require('101/clone');
var runnable = window.runnable;
var mockGetInstanceMaster = require('../../../fixtures/mockGetInstanceMaster');

describe('DNSConfigurationDirective'.bold.underline.blue, function() {
  var promisifyMock;
  var mockDepedencies;
  var mockMasterInstances;
  var element;
  var mockInstance;

  function injectSetupCompile() {
    mockMasterInstances = runnable.newInstances(instances.list, {
      noStore: true
    });

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
      _$compile_
    ) {
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });


    mockInstance = {
      fetchDependencies: sinon.stub().returns(mockDepedencies),
      on: sinon.spy(),
      off: sinon.spy()
    };

    $scope.instance = mockInstance;

    var tpl = directiveTemplate.attribute('dns-configuration', {
      instance: 'instance'
    });
    element = $compile(tpl)($scope);
    $elScope = element.isolateScope();
    $scope.$digest();
  }

  beforeEach(injectSetupCompile);

  describe('setting status class on the element', function () {
    beforeEach(function () {
      mockDepedencies.models.forEach(function (dep) {
        dep.instance.status = sinon.stub().returns('running');
      });
    });

    it('should do nothing if all containers are running', function () {
      expect(element[0].className).to.not.contain('red');
      expect(element[0].className).to.not.contain('orange');
    });

    it('should be set to red when there is a crashed container and a starting container', function () {
      mockDepedencies.models[0].instance.status.returns('crashed');
      mockDepedencies.models[1].instance.status.returns('starting');
      $scope.$digest();
      expect(element[0].className).to.contain('red');
    });

    it('should be set to orange when there is a starting container', function () {
      mockDepedencies.models[0].instance.status.returns('starting');
      $scope.$digest();
      expect(element[0].className).to.contain('orange');
    });
  });

});