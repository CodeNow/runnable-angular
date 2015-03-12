'use strict';

// injector-provided
var
  $compile,
  getInstanceClasses,
  getInstanceAltTitle,
  getTeamMemberClasses,
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
      _getInstanceClasses_,
      _getInstanceAltTitle_,
      _getTeamMemberClasses_,
      _$state_,
      _keypather_,
      _regexpQuote_,
      _$rootScope_,
      _$compile_
    ) {
      getInstanceClasses = _getInstanceClasses_;
      getInstanceAltTitle = _getInstanceAltTitle_;
      getTeamMemberClasses = _getTeamMemberClasses_;
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

    it('should show a list of users', function() {
      expect(ctx.element[0].querySelectorAll('.list-users > .list-item').length).to.equal(1);
    });

    it('should expand the user when active', function() {
      $scope.dataApp.data.instanceGroups.teamMembers[0].toggled = true;
      $scope.$digest();
      expect(ctx.element[0].querySelectorAll('.list-users > .list-item.active').length).to.equal(1);
      expect(ctx.element[0].querySelectorAll('.list-users > .list-item > .list-item').length).to.equal(2);
    });

    it('should show search results when a filter is present', function() {
      $elScope.filterString = 'good';
      $elScope.$digest();
      expect(ctx.element[0].querySelectorAll('.filter-list > .list-item').length).to.equal(1);
    });

    it('should show no results found when a filter is present with no matches', function() {
      $elScope.filterString = '312';
      $elScope.$digest();
      expect(ctx.element[0].querySelectorAll('.filter-list > .list-item').length).to.equal(0);
      expect(ctx.element[0].querySelectorAll('.filter-list .sub-header-text')[0].innerHTML).to.equal('No servers match your search');
    });

    it('should be able to transition to an instance when clicked', function(){
      $state.go = sinon.spy();
      var event = {
        preventDefault: sinon.spy()
      };
      var instance = $scope.dataApp.data.instances.models[0];
      $elScope.stateToInstance(instance, event);
      expect(event.preventDefault.calledOnce).to.equal(true);
      expect($state.go.calledWithExactly('instance.instance',
        {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        }
      )).to.equal(true);
    })
  });

});
