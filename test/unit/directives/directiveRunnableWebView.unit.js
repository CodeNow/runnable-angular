var jQuery  = require('jquery');

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

describe('directiveRunnableWebView'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
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

    ctx.element = angular.element(ctx.template);
    ctx.element = $compile(ctx.element)($scope);
    $scope.$digest();
    $httpBackend.flush();
    ctx.$element = jQuery(ctx.element);
    $elScope = ctx.element.isolateScope();
  };

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate('web-view', {});
  });

  it('basic dom', function() {
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

    injectSetupCompile();
    expect(ctx.$element).to.be.ok;
    expect(ctx.$element.find('> iframe').length).to.be.ok;
  });

  it('basic scope', function() {
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

    injectSetupCompile();
    expect($elScope).to.have.property('user');
    expect($elScope).to.have.property('instance');
    expect($elScope).to.have.property('actions');
    expect($elScope).to.have.deep.property('actions.forward');
    expect($elScope).to.have.deep.property('actions.back');
    expect($elScope).to.have.deep.property('actions.refresh');
    expect($elScope).to.have.property('data');
    expect($elScope).to.have.deep.property('data.iframeUrl');
  });

});
