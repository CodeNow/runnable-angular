describe('serviceFetch'.bold.underline.blue, function () {


  describe('factory pFetchUser', function(){
    var $state,
      user,
      $rootScope,
      pFetchUser
      ;

    beforeEach(function () {
      user = {
        fetchUser: sinon.spy()
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.value('user', user);
      });
      angular.mock.inject(function (
        _$state_,
        _pFetchUser_,
        _$rootScope_
      ) {
        $state = _$state_;
        pFetchUser = _pFetchUser_;
        $rootScope = _$rootScope_;
      });
    });

    it('should call the fetchUser method of the user service', function(done){
      var myUser = {
        name: "Ryan Kahn"
      };
      user.fetchUser = sinon.stub().callsArgWith(1, null, myUser);
      pFetchUser().then(function(foundUser){
        expect(user.fetchUser.calledOnce, 'fetchUser called').to.equal(true);
        expect(foundUser, 'Returned user').to.equal(myUser);
        done();
      });
      $rootScope.$apply();
    });

    it('should redirect on a 401 error', function(done){
      $state.go = sinon.stub();
      var err = {
        data: {
          statusCode: 401
        }
      };
      user.fetchUser = sinon.stub().callsArgWith(1, err);
      pFetchUser().catch(function(myErr){
        expect(myErr, 'Returned err').to.equal(err);
        expect($state.go.calledWith('home'), 'Called go home on the state').to.equal(true);
        done();
      });
      $rootScope.$apply();
    });
  });

  describe('factory fetchInstances', function(){
    var user,
      $rootScope,
      fetchInstances,
      $stateParams,
      $q,
      userStream,
      keypather,
      $state,
      errs
    ;

    var setupFetchInstances = function(pFetchUserFactory){
      errs = {
        handler: sinon.spy()
      };
      userStream = {
        on: sinon.spy()
      };
      var primus = {
        createUserStream: function(){
          return userStream
        }
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('pFetchUser', pFetchUserFactory);
        $provide.value('primus', primus);
        $provide.value('errs', errs);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchInstances_,
        _$stateParams_,
        _$q_,
        _keypather_,
        _$state_
      ) {
        $rootScope = _$rootScope_;
        fetchInstances = _fetchInstances_;
        $stateParams = _$stateParams_;
        $q = _$q_;
        keypather = _keypather_;
        $state = _$state_;
      });
    };


    it('should handle when the user is not signed in', function(){
      var err = {
        data: {
          statusCode: 401
        }
      };
      setupFetchInstances(function($q){
        return sinon.stub().returns($q.reject(err));
      });

      fetchInstances().catch(function(userError){
        expect(userError).to.equal(err)
      }).catch(function(e){
        done(e)
      });
      $rootScope.$apply();
    });

    it('should call fetch instances on the user object', function(done){
      var user = {
        models: [
          {
            name: 'MyModel'
          }
        ],
        fetchInstances: sinon.stub().callsArg(1)
      };
      setupFetchInstances(function($q){
        return sinon.stub().returns($q.when(user));
      });

      $stateParams.userName = "Myztiq";

      fetchInstances({name: 'MyModel'}).then(function(instance){
        expect(instance.name).to.equal('MyModel');
        expect(user.fetchInstances.calledOnce).to.equal(true);
        done()
      }).catch(function(e){
        done(e)
      });
      $rootScope.$apply();
    });

    it('should call fetch instances on the user object and return an array when the search is not for a specific named instance', function(done){
      var user = {
        models: [
          {
            name: 'MyModel'
          }
        ],
        fetchInstances: sinon.stub().callsArg(1)
      };
      setupFetchInstances(function($q){
        return sinon.stub().returns($q.when(user));
      });

      $stateParams.userName = "Myztiq";

      fetchInstances().then(function(instance){
        expect(instance.models[0].name).to.equal('MyModel');
        done()
      }).catch(function(e){
        done(e)
      });
      $rootScope.$apply();
    });

    describe('userStream events', function(){
      var instances, user;
      beforeEach(function(done){
        user = {
          models: [
            {
              name: 'MyModel'
            }
          ],
          find: sinon.spy(),
          add: sinon.spy(),
          remove: sinon.spy(),
          fetchInstances: sinon.stub().callsArg(1)
        };
        setupFetchInstances(function($q){
          return sinon.stub().returns($q.when(user));
        });

        $stateParams.userName = "Myztiq";

        keypather.set($rootScope, 'dataApp.data.activeAccount.oauthId', function(){
          return 1234;
        });

        $rootScope.$apply();

        fetchInstances().then(function(_instances){
          setTimeout(function(){
            instances = _instances;
            done()
          }, 0);
        }).catch(function(e){
          done(e)
        });
        $rootScope.$apply();
      });

      it('should register to data events', function(){
        expect(userStream.on.calledWith('data')).to.equal(true);
      });

      it('should listen to deploy message', function(){
        userStream.on.withArgs('data').lastCall.args[1]({
          event: 'ROOM_MESSAGE',
          data:{
            action: 'deploy',
            data: {
              name: 'New Instance',
              owner:{
                github: 1234
              }
            }
          }
        });
        expect(user.add.calledOnce).to.equal(true);
        expect(user.find.calledOnce).to.equal(true);
        expect(user.remove.called).to.equal(false);
        expect(errs.handler.called).to.equal(false);
      });

      it('should listen to post event', function(){
        userStream.on.withArgs('data').lastCall.args[1]({
          event: 'ROOM_MESSAGE',
          data:{
            action: 'post',
            data: {
              name: 'New Instance',
              owner:{
                github: 1234
              }
            }
          }
        });
        expect(user.add.calledOnce).to.equal(true);
        expect(user.find.calledOnce).to.equal(true);
        expect(user.remove.called).to.equal(false);
        expect(errs.handler.called).to.equal(false);
      });

      it('should listen to delete events', function(){
        $state.go = sinon.stub();
        $stateParams.instanceName = 'DELETE ME!';
        var myInstance = {
          attrs: {
            name: 'DELETE ME!'
          }
        };
        user.find = sinon.stub().returns(myInstance);
        userStream.on.withArgs('data').lastCall.args[1]({
          event: 'ROOM_MESSAGE',
          data:{
            action: 'delete',
            data: {
              name: 'New Instance',
              owner:{
                github: 1234
              }
            }
          }
        });
        expect(user.add.called, 'Add Called').to.equal(false);
        expect(user.find.calledOnce, 'Find called').to.equal(true);
        expect(user.remove.calledOnce, 'Remove called').to.equal(true);
        expect(user.remove.calledWith(myInstance), 'Removed called with myInstance').to.equal(true);
        expect($state.go.calledWith('instance.home'), 'Go to instance home').to.equal(true);
        expect(errs.handler.calledOnce, 'Errs handler called').to.equal(true);
      });
    });
  });

  describe('factory fetchBuild', function(){
    var $state,
      $rootScope,
      fetchBuild,
      user
      ;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('pFetchUser', function($q){
          user = {
            fetchBuild: sinon.stub().callsArg(1)
          };
          return sinon.stub().returns($q.when(user))
        });
      });
      angular.mock.inject(function (
        _$state_,
        _$rootScope_,
        _fetchBuild_
      ) {
        $state = _$state_;
        $rootScope = _$rootScope_;
        fetchBuild = _fetchBuild_;
      });
    });

    it('should call the fetchBuild method of the user', function(done){
      fetchBuild(123).then(function(fetchedBuild){
        expect(user.fetchBuild.calledOnce).to.equal(true);
        expect(user.fetchBuild.calledWith(123)).to.equal(true);
        expect(fetchedBuild).to.equal(user);
        done();
      });
      $rootScope.$apply();
    });

  });

  describe('factory fetchOwnerRepos', function(){
    var $state,
      $rootScope,
      fetchOwnerRepos,
      user
    ;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('pFetchUser', function($q){
          user = {
            oauthName: sinon.stub().returns('Myztiq'),
            fetchGithubRepos: sinon.stub().callsArgWith(1),
            newGithubRepos: sinon.stub().returnsArg(1),
            models: [
              {
                id: 'build ID'
              }
            ]
          };
          return sinon.stub().returns($q.when(user));
        });
      });
      angular.mock.inject(function (
        _$state_,
        _$rootScope_,
        _fetchOwnerRepos_
      ) {
        $state = _$state_;
        $rootScope = _$rootScope_;
        fetchOwnerRepos = _fetchOwnerRepos_;
      });
    });

    it('should call the fetchOwnerRepos method of the user', function(done){
      fetchOwnerRepos('Myztiq').then(function(){
        expect(user.fetchGithubRepos.calledOnce).to.equal(true);
        expect(user.newGithubRepos.calledOnce).to.equal(true);
        expect(user.newGithubRepos.calledWith(user.models)).to.equal(true);
        done();
      });
      $rootScope.$apply();
    });
  });


  describe('factory fetchContexts', function(){
    var $state,
      $rootScope,
      fetchContexts,
      user
      ;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('pFetchUser', function($q){
          user = {
            fetchContexts: sinon.stub().callsArgWith(1)
          };
          return sinon.stub().returns($q.when(user))
        });
      });
      angular.mock.inject(function (
        _$state_,
        _$rootScope_,
        _fetchContexts_
      ) {
        $state = _$state_;
        $rootScope = _$rootScope_;
        fetchContexts = _fetchContexts_;
      });
    });

    it('should call the fetchContexts method of the user', function(done){
      fetchContexts().then(function(fetchedContexts){
        expect(user.fetchContexts.calledOnce).to.equal(true);
        expect(fetchedContexts).to.equal(user);
        done();
      });
      $rootScope.$apply();
    });
  });
});