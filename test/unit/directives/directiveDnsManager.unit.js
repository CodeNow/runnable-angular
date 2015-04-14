'use strict';

// injector-provided
var $compile;
var $scope;
var $elScope;
var $rootScope;
var instances = require('../apiMocks').instances;
var runnable = new (require('runnable'))(window.host);
var $q;

describe('directiveDnsManager'.bold.underline.blue, function() {
  var ctx;
  var mockFetchInstances;
  var masterPods;
  var masterChildMapping;
  var instanceDependencies;

  function injectSetupCompile () {
    ctx = {};
    angular.mock.module('app');

    mockFetchInstances = sinon.stub();

    angular.mock.module(function ($provide) {
      $provide.value('fetchInstances', mockFetchInstances);
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$compile_,
      _$q_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      var masterInstances = runnable.newInstances(instances.list, {
        noStore: true
      });

      masterInstances.forEach(function (instance, index) {
        instance.attrs.contextVersion.context = 'TestContext' + index;
      });

      // Setup mockFetchInstances
      mockFetchInstances.withArgs({masterPod: true}).returns($q.when(masterInstances));
      masterPods = masterInstances.models;

      masterChildMapping = {};

      masterPods.forEach(function (instance, index) {
        var newInstances = [angular.copy(instances.running), angular.copy(instances.stopped)];
        newInstances[0]._id = 'NewInstance0-'+index;
        newInstances[1]._id = 'NewInstance1-'+index;
        newInstances[0].shortHash = index + 'abcde';
        newInstances[1].shortHash = index + 'fghij';

        var childInstances = runnable.newInstances(newInstances, {
          noStore: true
        });
        masterChildMapping[instance.attrs.shortHash] = childInstances.models;

        childInstances.models[0].attrs.contextVersion = {
          context: instance.attrs.contextVersion.context
        };
        childInstances.models[0].attrs.name = 'ABCDE' + index;

        childInstances.models[1].attrs.contextVersion = {
          context: instance.attrs.contextVersion.context
        };
        childInstances.models[1].attrs.name = 'FGHIJ' + index;

        childInstances.models[0].attrs.parent = instance.attrs.shortHash;
        childInstances.models[1].attrs.parent = instance.attrs.shortHash;

        childInstances.foo = index;

        mockFetchInstances.onCall(index + 1).returns($q.when(childInstances));
      });
    });
    $rootScope.$apply();

    // Get the first child of the first master instance.
    $scope.instance = masterChildMapping[masterPods[0].attrs.shortHash][0];
    var instanceDependency = masterChildMapping[masterPods[1].attrs.shortHash][1];
    instanceDependency.destroy = sinon.spy();
    instanceDependencies = {
      create: sinon.spy(),
      models: [ instanceDependency ]
    };
    $scope.instance.fetchDependencies = sinon.mock().returns(instanceDependencies);
    $scope.$digest();

    $scope.dnsSetup = false;

    ctx.template = directiveTemplate.attribute('dns-manager', {
      instance: 'instance',
      'dns-setup': 'dnsSetup'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();

    $elScope = ctx.element.isolateScope();

    $elScope.$digest();
  }

  it('should configure the scope variables', function(){
    injectSetupCompile();

    sinon.assert.calledWith(mockFetchInstances, { masterPod: true });

    // Should call fetch instances on every master pod but ours
    var scopeContext = $scope.instance.attrs.contextVersion.context;
    masterPods.forEach(function (instance) {
      var context = instance.attrs.contextVersion.context;
      if (context === scopeContext) {
        sinon.assert.neverCalledWith(mockFetchInstances, { masterPod: false, 'contextVersion.context': context});
      } else {
        sinon.assert.calledWith(mockFetchInstances, { masterPod: false, 'contextVersion.context': context});
      }
    });

    expect($elScope.dnsSetup, 'DNS is setup!').to.equal(true);

    expect($elScope.relatedMasterInstances.length, 'Related master instances length').to.equal(masterPods.length - 1);

    sinon.assert.calledOnce($scope.instance.fetchDependencies);

    var dependentInstanceContext = instanceDependencies.models[0].attrs.contextVersion.context;
    expect($elScope.instanceDependencyMap[dependentInstanceContext]).to.equal(instanceDependencies.models[0].attrs.shortHash);
  });

  it('should handle setDependency on a master instance', function () {
    injectSetupCompile();

    $elScope.actions.setDependency(masterPods[1], masterPods[1].attrs.shortHash);
    sinon.assert.calledOnce(instanceDependencies.models[0].destroy);
  });

  it('should handle setDependency on a master instance when one does not already exist', function () {
    injectSetupCompile();

    $elScope.actions.setDependency(masterPods[2], masterPods[2].attrs.shortHash);
    sinon.assert.notCalled(instanceDependencies.models[0].destroy);
  });

  it('should handle setDependency on a non master instance', function () {
    injectSetupCompile();
    $elScope.actions.setDependency(masterPods[1], masterChildMapping[masterPods[1].attrs.shortHash][1].attrs.shortHash);
    sinon.assert.calledOnce(instanceDependencies.create);
  });
});