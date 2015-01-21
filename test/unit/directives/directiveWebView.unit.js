'use strict';

// injector-provided
var $compile,
    $filter,
    $httpBackend,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;
var api_host = require('config/api').host.split('.').slice(1).join('.');
describe('directiveWebView'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.instance'
        }
      });

      $provide.value('$stateParams', {
        userName: 'username',
        instanceName: 'instancename'
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$filter_,
      _$httpBackend_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_,
      _user_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
      user = _user_;
    });

    /**
     * API Requests
     * - GET user
     * - GET instance
     */
    var userUrl = host + '/users/me?';
    $httpBackend
      .whenGET(userUrl)
      .respond(mocks.user);

    var instanceUrl = host + '/instances?githubUsername=username&name=instancename';
    $httpBackend
      .whenGET(instanceUrl)
      .respond(mocks.instances.runningWithContainers);

    modelStore.reset();
    collectionStore.reset();

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $httpBackend.flush();
    $elScope = ctx.element.isolateScope();
  };

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate.attribute('web-view');
  });

  beforeEach(injectSetupCompile);

  it('basic dom', function() {
    expect(ctx.element).to.be.ok;
    expect(ctx.element.find('iframe')).to.be.ok;
  });

  it('basic scope', function() {
    expect($elScope).to.have.property('user');
    expect($elScope).to.have.property('instance');
    expect($elScope).to.have.property('actions');
    expect($elScope).to.have.deep.property('actions.refresh');
    expect($elScope).to.have.property('data');
    expect($elScope).to.have.deep.property('data.iframeUrl');
  });

  it('should replace the url with a new one when the instance changes', function () {
    expect($elScope.data.iframeUrl.toString()).to.equal('about:blank');
    $rootScope.$digest();
    $timeout.flush();
    expect($elScope.data.iframeUrl.toString()).to.equal('http://anand-api.codenow.' + api_host);
  });

  it('should change the name when the instance starts', function () {
    expect($elScope.data.iframeUrl.toString()).to.equal('about:blank');
    $rootScope.$digest();
    $timeout.flush();

    // Use reset to update the containers
    $elScope.instance.reset({
      name: 'ruuuuunable'
    });

    $elScope.instance.containers.models[0].attrs.inspect.State.StartedAt = 'bananas';

    $rootScope.$digest();
    $timeout.flush();

    expect($elScope.data.iframeUrl.toString()).to.equal('http://ruuuuunable.codenow.' + api_host);
  });

  it('will not change if the only difference is capitalization', function () {
    expect($elScope.data.iframeUrl.toString()).to.equal('about:blank');
    expect($elScope.instance.attrs.name).to.equal('anand-api');
    $rootScope.$digest();
    $timeout.flush();

    $elScope.instance.attrs.name = 'aNaNd-ApI';
    $elScope.instance.reset({
      name: 'aNaNd-ApI'
    });

    $rootScope.$digest();

    expect($elScope.data.iframeUrl.toString()).to.equal('http://anand-api.codenow.' + api_host);
  });

});
