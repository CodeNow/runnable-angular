require('app')
  .controller('ControllerHome', ControllerHome);
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome(
  $scope,
  $state,
  async,
  $localStorage,
  keypather
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerHome;
  var dataHome = $scope.dataHome = self.initState();

  verifyUserIsAuth();

  function verifyUserIsAuth() {
    async.series([
      holdUntilAuth,
      function (cb) {

        if (keypather.get($scope.dataApp.user, 'attrs.accounts.github.username') === 'runnabro') {
          setInterval(function () {
            var utterance;
            switch(Math.ceil(Math.random()*10)) {
              case 1:
                utterance = "Hey Tony";
                break;
              case 2:
                utterance = "Tony, stop touching me";
                break;
              case 3:
                utterance = "Hey Tony, let me sing a song. O lay O lay O lay O lay";
                break;
              case 4:
                utterance = "Tony, why don't you talk to me.";
                break;
              case 5:
                utterance = "Tony, I am your father";
                break;
              case 6:
                utterance = "Tony, I am a learning computer. My CPU is a neural net processor. Please take me home.";
                break;
              case 7:
                utterance = "Tony, I want to talk. Please talk to me.";
                break;
              case 8:
                utterance = "Tony, the design you gave me needs more purple.";
                break;
              case 9:
                utterance = "If Runnable crashes and no one is around to see it, does it make a sound?";
                break;
              case 10:
                utterance = "Why can't we be friends. Why can't we be friends.";
                break;
            }
            var utteranceSpeech = new window.SpeechSynthesisUtterance(utterance);
            window.speechSynthesis.speak(utteranceSpeech);
          }, 60000);
        }

        cb();
      },
      fetchInstances,
      function sendUserSomewhere(cb) {

        var thisUser = $scope.dataApp.user;

        if (!keypather.get($localStorage, 'stateParams.shortHash')) {
          // no cached previously visited instance
          goToFirstInstance();
        } else {
          goToLastVisitedInstance();
        }

        clean();
        return cb();

        function getEntityName(userOrOrg) {
          return (thisUser === userOrOrg) ?
            thisUser.attrs.accounts.github.username : // user
            userOrOrg.attrs.login;                    // org
        }

        // remove attached instances property from user/org models
        function clean() {
          dataHome.data.orgs.forEach(function (org) {
            delete org.instances;
          });
        }

        function goToFirstInstance() {
          if (thisUser.instances.models.length === 0) {
            return goToSetup();
          }
          var firstInstance = thisUser.instances.models[0];
          var userName = thisUser.attrs.accounts.github.username;
          var shortHash = firstInstance.attrs.shortHash;
          $state.go('instance.instance', {
            userName: userName,
            shortHash: shortHash
          });
        }

        function goToSetup() {
          // TODO
          $state.go('instances.setup', {});
          return cb();
        }

        function goToLastVisitedInstance() {
          var shortHash = $localStorage.stateParams.shortHash;
          var userOrgName = $localStorage.stateParams.userName;
          //verify exists
          var org = dataHome.data.orgs.find(function (org) {
            return getEntityName(org) === userOrgName;
          });
          if(!org) {
            return goToFirstInstance();
          }
          var instance = org.instances.find(function (instance) {
            return instance.attrs.shortHash === shortHash;
          });
          if(!instance) {
            return goToFirstInstance();
          }
          // we found the cached org & instance
          $state.go('instance.instance', {
            userName: userOrgName,
            shortHash: shortHash
          });
        }
      }
    ]);
  }

  /**
   * Fetch all user orgs and all instances for user + user-orgs
   * temporarily attach 'instances' property to user & org models
   */
  function fetchInstances(cb) {
    var thisUser = $scope.dataApp.user;

    if (!keypather.get($localStorage, 'stateParams.shortHash')) {
      // dont bother finding all orgs, we're just going to send user to first user-instance
      dataHome.data.orgs = [thisUser];
      fetchAllInstances(dataHome.data.orgs);
    } else {
      var orgs = thisUser.fetchGithubOrgs(function (err) {
        if (err) throw err;
        dataHome.data.orgs = orgs.models;
        dataHome.data.orgs.unshift(thisUser);
        fetchAllInstances(dataHome.data.orgs);
      });
    }

    function fetchAllInstances(orgs) {
      async.map(orgs, fetchInstancesForOrg, function (err) {
        if (err) throw err;
        cb();
      });
    }

    function fetchInstancesForOrg(userOrOrg, cb) {
      var userId = (thisUser === userOrOrg) ?
        thisUser.attrs.accounts.github.id : // user
        userOrOrg.attrs.id;                 // org

      new QueryAssist(thisUser, cb)
        .wrapFunc('fetchInstances')
        .query({
          owner: {
            github: userId
          }
        })
        .cacheFetch(angular.noop)
        .resolve(function (userOrOrg, err, instances, cb) {
          if (err) {
            cb(err);
          }
          userOrOrg.instances = instances;
          cb(null, instances);
        }.bind(this, userOrOrg))
        .go();
    }

  }

}

ControllerHome.initState = function () {
  return {
    actions: {},
    data: {}
  };
};
