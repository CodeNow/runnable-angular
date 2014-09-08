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
