'use strict';

// injector-provided
var $compile;
var $scope;
var $elScope;
var $rootScope;
var instances = require('../apiMocks').instances;
var runnable = new (require('runnable'))(window.host);
var mockGetInstanceMaster = require('../fixtures/mockGetInstanceMaster');

// Skipping until we bring this directive back (Kahn)
describe.only('directiveDnsManager'.bold.underline.blue, function() {
  var ctx;
  var masterPods;
  var masterChildMapping;
  var instanceDependencies;

  function injectSetupCompile () {
    ctx = {};
    angular.mock.module('app');

    var masterInstances = runnable.newInstances(instances.list, {
      noStore: true
    });

    masterInstances.forEach(function (instance, index) {
      instance.attrs.contextVersion.context = 'TestContext' + index;
    });

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


      childInstances.models[0].destroy = sinon.spy();
      childInstances.models[1].destroy = sinon.spy();

      masterChildMapping[instance.attrs.shortHash] = childInstances.models;

      instance.children = {
        fetch: sinon.stub().callsArg(0),
        models: childInstances
      };
    });

    angular.mock.module(function ($provide) {
      $provide.factory('getInstanceMaster', mockGetInstanceMaster(masterPods));
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$compile_
    ) {
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    });


    $rootScope.$apply();

    // Make sure we can fetch the dependencies of the master instance
    masterPods[0].fetchDependencies = sinon.mock().returns({
      models: [
        masterPods[1],
        masterChildMapping[masterPods[2].attrs.shortHash][1]
      ]
    });

    // Setup our instance to be a child of the master instance
    $scope.instance = masterChildMapping[masterPods[0].attrs.shortHash][0];

    // Setup our instance dependency override
    var instanceDependency = masterChildMapping[masterPods[1].attrs.shortHash][1];
    instanceDependency.destroy = sinon.spy();
    instanceDependencies = {
      create: sinon.spy(),
      models: [ instanceDependency ]
    };
    $scope.instance.fetchDependencies = sinon.mock().returns(instanceDependencies);

    // Okay, digesat this shit and let's get started with testing.
    $scope.$digest();

    $scope.isDnsSetup = false;

    ctx.template = directiveTemplate.attribute('dns-manager', {
      instance: 'instance',
      'is-dns-setup': 'isDnsSetup'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();

    $elScope = ctx.element.isolateScope();

    $elScope.$digest();
  }

  it('should configure the scope variables', function(){
    injectSetupCompile();

    expect($elScope.isDnsSetup, 'DNS is setup!').to.equal(true);

    expect($elScope.directlyRelatedMasterInstances.length, 'Directly related master instances length').to.equal(2);

    sinon.assert.calledOnce($scope.instance.fetchDependencies);

    var dependentInstanceContext = instanceDependencies.models[0].attrs.contextVersion.context;
    expect($elScope.instanceDependencyMap[dependentInstanceContext]).to.equal(instanceDependencies.models[0]);
  });

  it('should handle setDependency on a master instance', function () {
    injectSetupCompile();

    $elScope.actions.setDependency(masterPods[1]);
    $elScope.$digest();
    sinon.assert.calledOnce(instanceDependencies.models[0].destroy);
    sinon.assert.calledOnce(instanceDependencies.create);
  });

  it('should handle setDependency on a master instance when one does not already exist', function () {
    injectSetupCompile();

    $elScope.actions.setDependency(masterPods[2]);
    $elScope.$digest();
    sinon.assert.calledOnce(instanceDependencies.create);
  });

  it('should handle setDependency on a non master instance', function () {
    injectSetupCompile();
    $elScope.actions.setDependency(masterChildMapping[masterPods[1].attrs.shortHash][1]);
    $elScope.$digest();
    sinon.assert.calledOnce(instanceDependencies.create);
  });
});