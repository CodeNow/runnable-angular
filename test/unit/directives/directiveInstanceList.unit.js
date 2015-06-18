'use strict';

// injector-provided
var
  $compile,
  $state,
  keypather,
  regexpQuote,
  $rootScope,
  $scope;
var $elScope;

function fetch (cb) {
  cb();
}

function getInstances(){
  return [
    {
      attrs: {
        name: 'hello',
        owner: {
          username: 'runnable-doobie'
        },
        env: ['a=b']
      },
      state: {
        name: 'hello-copy',
        toggled: false
      },
      fetch: fetch
    },
    {
      attrs: {
        name: 'goodbye',
        owner: {
          username: 'runnable-doobie'
        },
        env: ['a=b']
      },
      state: {
        name: 'goodbye-copy',
        toggled: false
      },
      fetch: fetch
    }
  ]
}

function makeDeps () {
  return {
    actions: {
      setToggled: function(teamMember){
        teamMember.toggled = !teamMember.toggled;
      }
    },
    state:{
      params: {
        userName: 'runnable-doobie'
      }
    },
    data: {
      instances: {
        models: getInstances()
      },
      instanceGroups:{
        teamMembers: [
          {
            github: 6379413,
            gravatar: "https://avatars.githubusercontent.com/u/6379413?v=3",
            username: "Nathan219",
            toggled: false,
            instances: getInstances()
          }
        ]
      }
    }
  };
}

describe('directiveInstanceList'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile (type) {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$state_,
      _keypather_,
      _regexpQuote_,
      _$rootScope_,
      _$compile_
    ) {
      $state = _$state_;
      keypather = _keypather_;
      regexpQuote = _regexpQuote_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
    });

    ctx = {};
    $scope.dataApp = makeDeps();

    ctx.template = directiveTemplate.attribute('instance-list', {
      'data': "dataApp.data",
      'state ': "dataApp.state",
      'actions ': "dataApp.actions"
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Functionality', function() {
    beforeEach(function () {
      injectSetupCompile();
    });
    // TODO: Kick can
  });

});
