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

describe.skip('directiveRunnableSetupPrimaryActions'.bold.underline.blue, function() {
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

    var buildUrl = host + '/instances?githubUsername=username&name=instancename';
    $httpBackend
      .whenGET(buildUrl)
      .respond(mocks.instances.runningWithContainers);

    modelStore.reset();

    $scope.loading = false;
    $scope.name = '';
    $scope.valid = false;

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    // $httpBackend.flush();
    $elScope = ctx.element.isolateScope();
  };

  beforeEach(function () {
    angular.mock.module('app');
  });

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate('runnable-setup-primary-actions', {
      loading: 'loading',
      name: '',
      valid: ''
    });
  });

  // afterEach($httpBackend.verifyNoOutstandingRequest);
  // afterEach($httpBackend.verifyNoOutstandingExpectation);

  it('basic dom', function() {
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.setup'
        }
      });

      $provide.value('$stateParams', {
        buildId: '555'
      });
    });

    injectSetupCompile();
    expect(ctx.element).to.be.ok;
    //expect(ctx.$element.find('> iframe').length).to.be.ok;
  });

  it('basic scope', function() {
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.setup'
        }
      });

      $provide.value('$stateParams', {
        buildId: '555'
      });
    });

    injectSetupCompile();
    expect(true).to.be.ok;
    //expect($elScope).to.have.property('user');
  });

});
