'use strict';
var jsonHash = require('json-hash');
var apiConfig = require('../config/api');
var GithubOrgCollection = require('@runnable/api-client/lib/collections/github-orgs.js');

require('app')
  // User + Orgs
  .factory('fetchUser', fetchUser)
  .factory('fetchWhitelistForDockCreated', fetchWhitelistForDockCreated)
  .factory('fetchWhitelistedOrgs', fetchWhitelistedOrgs)
  .factory('fetchWhitelists', fetchWhitelists)
  .factory('fetchGithubOrgId', fetchGithubOrgId)
  .factory('fetchOrgRegisteredMembers', fetchOrgRegisteredMembers)
  .factory('fetchOrgMembers', fetchOrgMembers)
  .factory('fetchGrantedGithubOrgs', fetchGrantedGithubOrgs)
  .factory('fetchOrgTeammateInvitations', fetchOrgTeammateInvitations)
  // All whitelisted usernames must be in lowercase
  .value('manuallyWhitelistedUsers', ['jdloft', 'hellorunnable', 'evandrozanatta', 'rsandor'])
  // Containers
  .factory('fetchInstances', fetchInstances)
  .factory('fetchInstance', fetchInstance)
  .factory('fetchInstancesByPod', fetchInstancesByPod)
  .factory('fetchBuild', fetchBuild)
  .factory('fetchRepoBranches', fetchRepoBranches)
  .factory('fetchContexts', fetchContexts)
  .factory('fetchDebugContainer', fetchDebugContainer)
  .factory('fetchStackData', fetchStackData)
  // Github API
  .factory('fetchGitHubUser', fetchGitHubUser)
  .factory('fetchGitHubMembers', fetchGitHubMembers)
  .factory('fetchGitHubAdminsByRepo', fetchGitHubAdminsByRepo)
  .factory('fetchGitHubTeamsByRepo', fetchGitHubTeamsByRepo)
  .factory('fetchGitHubTeamMembersByTeam', fetchGitHubTeamMembersByTeam)
  .factory('fetchGithubUserForCommit', fetchGithubUserForCommit)
  .factory('fetchOwnerRepos', fetchOwnerRepos)
  .factory('fetchPullRequest', fetchPullRequest)
  // Settings
  .factory('verifySlackAPITokenAndFetchMembers', verifySlackAPITokenAndFetchMembers)
  .factory('fetchSettings', fetchSettings)
  .factory('integrationsCache', integrationsCache)
  // Billing
  .factory('fetchPlan', fetchPlan)
  .factory('fetchInvoices', fetchInvoices)
  .factory('fetchPaymentMethod', fetchPaymentMethod);

function fetchUser(
  $q,
  $window,
  apiClientBridge,
  keypather,
  memoize,
  promisify,
  report
) {
  return memoize(function () {
    return promisify(apiClientBridge, 'fetchUser')('me')
      .then(function (user) {
        user.createSocket();
        report.setUser(user);
        return user;
      })
      .catch(function (err) {
        // Catch an unauth'd request and send 'em back
        if (keypather.get(err, 'data.statusCode') === 401) {
          $window.location = apiConfig.corporateUrl;
          // Return a never completing function since we are redirecting!
          return $q(angular.noop);
        }
        // Allow other .catch blocks to grab it
        return $q.reject(err);
      });
  });
}

function fetchWhitelistedOrgs(
  fetchUser,
  fetchWhitelists,
  memoize
) {
  return memoize(function () {
    return fetchUser()
      .then(function (user) {
        return fetchWhitelists()
          .then(function (userWhitelists) {
            var githubOrgs = userWhitelists.map(function (userWhitelistModel) {
              return userWhitelistModel.attrs.org;
            });
            return new GithubOrgCollection(githubOrgs, {client: user.client});
          });
      });
  });
}

/**
 * Fetches the orgs that have been whitelisted for our api
 * (This version  does not cache, and should only be used by the org select)
 * @param fetchUser
 * @param promisify
 * @returns {*}
 */
function fetchWhitelistForDockCreated(
  fetchUser,
  promisify
) {
  return function () {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'fetchUserWhitelists', true)();
      })
      .then(function (res) {
        return res.models.filter(function (userWhiteListModel) {
          return !!userWhiteListModel.attrs.org;
        });
      });
  };
}

/**
 * Fetches the orgs that have been whitelisted for our api
 * (This version uses memoize for caching)
 * @param fetchWhitelistForDockCreated
 * @param memoize
 * @returns {*}
 */
function fetchWhitelists(
  fetchWhitelistForDockCreated,
  memoize
) {
  return memoize(function () {
    return fetchWhitelistForDockCreated();
  });
}


var fetchCache = {};

function fetchInstances(
  $q,
  $state,
  exists,
  fetchUser,
  keypather,
  promisify
) {
  return function (opts, resetCache) {
    if (!opts) {
      opts = {};
    }
    if (!exists(resetCache)) {
      resetCache = false;
    }
    opts.githubUsername = opts.githubUsername || $state.params.userName;

    opts.ignoredFields = [
      'contextVersions[0].build.log',
      'contextVersion.build.log'
    ];

    var fetchKey = jsonHash.digest(opts);
    if (resetCache || !fetchCache[fetchKey]) {
      fetchCache[fetchKey] = fetchUser()
        .then(function (user) {
          var pFetch = promisify(user, 'fetchInstances');
          return pFetch(opts);
        })
        .then(function (results) {
          var instance = results;
          if (opts.name) {
            instance = keypather.get(results, 'models[0]');
          }

          if (!instance) {
            return $q.reject(new Error('Container not found'));
          }
          instance.githubUsername = opts.githubUsername;
          return instance;
        });
    }
    return fetchCache[fetchKey];
  };
}

function fetchInstance(
  fetchUser,
  promisify
) {
  return function (instanceId) {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'fetchInstance')(instanceId);
      });
  };
}

var fetchByPodCache = {};

function fetchInstancesByPod(
  $state,
  fetchInstances,
  fetchUser,
  report
) {
  return function (username) {
    username = username || $state.params.userName;
    if (!fetchByPodCache[username]) {
      var userPromise = fetchUser();
      fetchByPodCache[username] = fetchInstances({
        githubUsername: username
      })
        .then(function (allInstances) {
          return userPromise.then(function (user) {
            var instances = user.newInstances([], {
              qs: {
                masterPod: true,
                githubUsername: username
              }
            });
            function sortAllInstances(allInstances) {
              var instanceMapping = {};
              allInstances.forEach(function (instance) {
                var parentId = instance.attrs.parent;
                if (instance.attrs.masterPod) {
                  parentId = instance.attrs.shortHash;
                }

                instanceMapping[parentId] = instanceMapping[parentId] || {};
                if (instance.attrs.masterPod) {
                  instanceMapping[parentId].master = instance;
                } else {
                  instanceMapping[parentId].children = instanceMapping[parentId].children || [];
                  instanceMapping[parentId].children.push(instance);
                }
              });

              var masterInstances = [];
              Object.keys(instanceMapping).forEach(function (parentId) {
                var master = instanceMapping[parentId].master;
                var children = instanceMapping[parentId].children || [];

                // Handle the case where we have an extra instance that has no parents.
                if (!master || !master.children) {
                  if (children && children.length) {
                    children.forEach(function (child) {
                      report.info('Orphaned child detected', {
                        child: child.id(),
                        name: child.attrs.name,
                        owner: child.attrs.owner
                      });
                    });
                  }
                  return;
                }

                masterInstances.push(master);
                master.setChildren(children);
              });
              return masterInstances;
            }

            allInstances.refreshOnDisconnect = true;
            allInstances.on('reconnection', function () {
              var masterInstances = sortAllInstances(allInstances);
              instances.reset(masterInstances);
            });
            instances.githubUsername = username;
            instances.reset(sortAllInstances(allInstances));
            return instances;
          });
        });
    }

    return fetchByPodCache[username];
  };
}

function fetchBuild(
  fetchUser,
  promisify
) {
  // No caching here, as there aren't any times we're fetching a build
  //    multiple times that isn't covered by inflight
  return function (buildId) {
    if (!buildId) {
      throw new Error('BuildId is required');
    }

    return fetchUser().then(function (user) {
      var pFetch = promisify(user, 'fetchBuild');
      return pFetch(buildId);
    });
  };
}

function fetchOwnerRepos(fetchUser, promisify) {
  return function (userName) {
    var user;
    var repoType;
    return fetchUser().then(function (_user) {
      if (userName === _user.oauthName()) {
        user = _user;
        repoType = 'GithubRepos';
      } else {
        user = _user.newGithubOrg(userName);
        repoType = 'Repos';
      }
      var allRepos = [];
      function fetchPage(page) {
        return promisify(user, 'fetch' + repoType)({
          page: page,
          sort: 'update'
        }).then(function (githubRepos) {
          allRepos = allRepos.concat(githubRepos.models);
          // recursive until result set returns fewer than
          // 100 repos, indicating last paginated result
          if (githubRepos.models.length < 100) {
            return allRepos;
          }
          return fetchPage(page + 1);
        });
      }
      return fetchPage(1);
    }).then(function (reposArr) {
      var repos = user['new' + repoType](reposArr, {
        noStore: true
      });
      repos.ownerUsername = userName;
      return repos;
    });
  };
}


function fetchRepoBranches(fetchUser, promisify) {
  return function (repo) {
    var allBranches = [];

    function fetchPage(page) {
      return promisify(repo, 'fetchBranches')({
        page: page
      }).then(function (branchesCollection) {
        allBranches = allBranches.concat(branchesCollection.models);
        // recursive until result set returns fewer than
        // 100 repos, indicating last paginated result
        if (branchesCollection.models.length < 100) {
          return allBranches;
        }
        return fetchPage(page + 1);
      });
    }
    return fetchPage(1)
      .then(function (branchArray) {
        var branches = repo.newBranches(branchArray, {
          noStore: true
        });
        repo.branches = branches;
        return branches;
      });
  };
}

function fetchContexts(fetchUser, promisify) {
  return function (opts) {
    return fetchUser().then(function (user) {
      var contextFetch = promisify(user, 'fetchContexts');
      return contextFetch(opts);
    });
  };
}

function fetchSettings(
  $q,
  $state,
  fetchUser,
  integrationsCache,
  keypather,
  promisify
) {
  return function () {
    var username = $state.params.userName;

    if (integrationsCache[username]) {
      return $q.when(integrationsCache[username].settings);
    }

    return fetchUser().then(function(user) {
      return promisify(user, 'fetchSettings')({
        githubUsername: $state.params.userName
      });
    })
      .then(function (settingsCollection) {
        var userSettings = settingsCollection.models[0];
        if (userSettings) {
          integrationsCache[$state.params.userName] = {
            settings: userSettings,
            /*!
             * We store a copy of Slack and GitHub settings in order to
             * correctly determine if the cache on these should be thrown away
             */
            notificationsSettings: angular.copy(keypather.get(userSettings, 'attrs.notifications'))
          };
        }
        return userSettings;
      });
  };
}

function integrationsCache() {
  return {};
}

function verifySlackAPITokenAndFetchMembers(
  $http,
  $q
) {
  return function (token) {
    return $http({
      method: 'get',
      url: 'https://slack.com/api/users.list?token=' + token,
      'withCredentials': false,
      headers: {
        'X-CSRF-TOKEN': undefined
      }
    })
      .then(function (data) {
        if (data.data.error) {
          if (data.data.error === 'invalid_auth' && !data.data.ok) {
             // Throw a more descriptive error
            return $q.reject(new Error('Provided API key is invalid'));
          }
          return $q.reject(new Error(data.data.error));
        }
        return data.data.members.filter(function (member) {
          return !member.is_bot && !member.deleted;
        });
      });
  };
}

function fetchGitHubMembers(
  $http,
  configAPIHost,
  memoizeAll
) {
  var _fetchGitHubMembers = memoizeAll(function (teamName, page) {
    if (!page) {
      page = 1;
    }
    return $http({
      method: 'get',
      url: configAPIHost + '/github/orgs/' + teamName + '/members?per_page=100&page=' + page
    }).then(function (res) {
      if (!Array.isArray(res.data)) {
        return [];
      }
      if (res.data.length === 0) {
        // NOTE: In the future, we might want to use the pagination header
        // provided by Github instead of checking for an empty array
        return res.data;
      }
      return _fetchGitHubMembers(teamName, page + 1)
        .then(function (teamMembers) {
          return res.data.concat(teamMembers);
        });
    });
  });
  return _fetchGitHubMembers;
}

/**
 * Makes a github request for orgs, which should only return orgs that have granted us access
 * @param fetchUser
 * @param promisify
 * @returns {Function}
 */
function fetchGrantedGithubOrgs(
  fetchUser,
  promisify
) {
  return function () {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'fetchGithubOrgs')();
      });
  };
}

/**
 * Get all Runnable users (logged in through GH) that belong to a particular
 * Github organization.
 *
 * @param {String}
 * @resolves {Collection}
 * @returns {Promise}
 */
function fetchOrgRegisteredMembers(
  fetchUser,
  memoize,
  promisify
) {
  return memoize(function (orgName) {
    return fetchUser().then(function (user) {
      return promisify(user, 'fetchUsers')({ githubOrgName: orgName });
    });
  });
}

/**
 * Given a user commit model, fetch the GH who made the commit. Also return an
 * `isRunnableUser` property pointing to whether the user is a Runnable user.
 *
 * @param {Object} commit
 * @resolves {Object} - GitHub User
 * @returns {Promise}
 */
function fetchGithubUserForCommit (
  $q,
  assign,
  fetchGitHubUser,
  fetchOrgRegisteredMembers,
  keypather,
  memoize,
  promisify
) {
  return memoize(function (commit) {
    return promisify(commit, 'fetch')()
      .then(function (commit) {
        var userName = keypather.get(commit, 'attrs.author.login');
        return $q.all({
          githubUser: fetchGitHubUser(userName),
          runnableUser: fetchOrgRegisteredMembers(userName)
        })
        .then(function (response) {
          return assign(response.githubUser, {
            isRunnableUser: Boolean(response.runnableUser.models.length),
          });
        });
      });
  });
}

/**
 * Given an Github organization names, get the organizations ID if the current
 * user hast access to that organization
 *
 * @param {String}
 * @resolves {Number}
 * @return {Promise}
 */
function fetchGithubOrgId(
  $q,
  fetchWhitelistedOrgs,
  keypather,
  memoize
) {
  return memoize(function (orgName) {
    return fetchWhitelistedOrgs()
      .then(function (orgsCollection) {
        var orgs = orgsCollection.filter(function (org) {
          return keypather.get(org, 'attrs.login') === orgName;
        });
        if (orgs.length > 0) {
          var orgId = orgs[0].attrs.id;
          return orgId;
        }
        return $q.reject('No Github organization found for org name provided');
      });
  });
}

/**
 * Fetch all the teammate invitations for a particular Github organization
 *
 * @param {String|Number}
 * @resolves {Collection}
 * @return {Promise}
 */
function fetchOrgTeammateInvitations(
  $q,
  fetchGithubOrgId,
  fetchUser,
  promisify
) {
  return function (orgNameOrId) {
    return $q.when()
      .then(function () {
        if (typeof orgNameOrId === 'string') {
          return fetchGithubOrgId(orgNameOrId);
        }
        if (typeof orgNameOrId === 'number') {
          return orgNameOrId;
        }
        return $q.reject(new TypeError(
          'Github organization ID or name must be provided. ' +
          'Parameter was neither a number nor a string.'
        ));
      })
      .then(function (githubOrgId) {
        return fetchUser()
          .then(function (user) {
            return promisify(user, 'fetchTeammateInvitations', true)({ orgGithubId: githubOrgId });
          });
      });
  };
}

/**
 * Get an object with all members for an organization, all registered members (
 * registered in Runnable), all unregistered members who have been invited, and
 * all unregistered members who have not been invited.
 *
 * @param {String}
 * @resolves {Object}
 * @returns {Promise}
 */
function fetchOrgMembers(
  $q,
  fetchGitHubMembers,
  fetchGitHubUser,
  fetchOrgRegisteredMembers,
  fetchOrgTeammateInvitations,
  keypather
) {
  return function (teamName, fetchGithubUserEmail) {
    return $q.all([
      fetchGitHubMembers(teamName),
      fetchOrgRegisteredMembers(teamName),
      fetchOrgTeammateInvitations(teamName)
    ])
      .then(function (responseArray) {
        if (fetchGithubUserEmail) {
          return $q.all([
            $q.all(responseArray[0].map(function (member) {
              // Fetch the complete user profile, in order to get user email
              return fetchGitHubUser(member.login);
            })),
            responseArray[1],
            responseArray[2]
          ]);
        }
        return responseArray;
      })
      .then(function (responseArray) {
        var githubMembers = responseArray[0];
        var runnableUsersCollection = responseArray[1];
        var teammateInvitationCollection = responseArray[2];

        var registeredGithubMembers = [];
        var invitedGithubMembers = [];
        var uninvitedGithubMembers = [];

        var runnableUsers = {};
        var invitedUsers = {};
        runnableUsersCollection.forEach(function (memberModel) {
          var username = keypather.get(memberModel, 'attrs.accounts.github.username');
          if (username) {
            runnableUsers[username] = memberModel;
          }
        });
        teammateInvitationCollection.forEach(function (invitationModel) {
          var githubId = keypather.get(invitationModel, 'attrs.recipient.github');
          if (githubId) {
            invitedUsers[githubId] = invitationModel;
          }
        });

        githubMembers.forEach(function (member) {
          if (runnableUsers[member.login]) {
            member.userModel = runnableUsers[member.login];
            registeredGithubMembers.push(member);
          } else if (invitedUsers[member.id]) {
            member.userInvitation = invitedUsers[member.id];
            invitedGithubMembers.push(member);
          } else {
            uninvitedGithubMembers.push(member);
          }
        });
        return {
          registered: registeredGithubMembers,
          invited: invitedGithubMembers,
          uninvited: uninvitedGithubMembers,
          all: githubMembers
        };
      });
  };
}

function fetchGitHubUser(
  $http,
  configAPIHost,
  memoize
) {
  return memoize(function (memberName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/users/' + memberName
    }).then(function (user) {
      return user.data;
    });
  });
}

/**
 * Given an org name and a repo name, fetch all github users who have admin access to a repo.  This
 * returns a promise containing a map of all of the users, indexed by their github login.
 * @param $http
 * @param $q
 * @param configAPIHost
 * @param fetchGitHubUser
 * @param keypather
 * @returns {Function} promise containing an map of github admins indexed by login
 */
function fetchGitHubAdminsByRepo(
  $http,
  $q,
  configAPIHost,
  fetchGitHubUser,
  keypather
) {
  return function (orgName, repoName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + orgName + '/' + repoName + '/collaborators',
      headers: {
        Accept: 'application/vnd.github.ironman-preview+json'
      }
    })
      .then(function (collaboratorsResponse) {
        return collaboratorsResponse.data.filter(function (user) {
          return keypather.get(user, 'permissions.admin');
        });
      })
      .then(function (userArray) {
        return $q.all(userArray.map(function (user) {
          return fetchGitHubUser(user.login);
        }));
      });
  };
}

/**
 * Given an org name and a repo name, fetch all teams with admin permissions.  These teams can then
 * be queried to fetch users with admin permissions.
 * @param $http
 * @param configAPIHost
 * @returns {Function} promise containing team objects with admin permissions
 */
function fetchGitHubTeamsByRepo(
  $http,
  configAPIHost
) {
  return function (orgName, repoName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + orgName + '/' + repoName + '/teams'
    })
      .then(function (teamsResponse) {
        return teamsResponse.data.filter(function (team) {
          return team.permission === 'admin';
        });
      });
  };
}

/**
 * Given either a team object (like from fetchGitHubTeamsByRepo), or a teamId, fetch all active team
 * members.  All users with pending statuses are removed.  The user model that comes back isn't a
 * full user model from github, so if any user-specific info is needed, you must use fetchGitHubUser
 * @param $http
 * @param configAPIHost
 * @returns {Function}
 */
function fetchGitHubTeamMembersByTeam(
  $http,
  configAPIHost,
  memoize
) {
  return function (team) {
    var fetchByTeamId = memoize(function (teamId) {
      return $http({
        method: 'get',
        url: configAPIHost + '/github/teams/' + teamId + '/members'
      })
        .then(function (members) {
          return members.data.filter(function (member) {
            return member.state !== 'pending';
          });
        });
    });
    // Memoize function by its team id
    var teamId = (typeof team === 'object') ? team.id : team;
    return fetchByTeamId(teamId);
  };
}

function fetchPullRequest(
  $http,
  $q,
  configAPIHost,
  keypather
) {
  return function (instance) {
    var branch = instance.getBranchName();
    if (!branch) {
      return $q.when(null);
    }
    var repo = instance.contextVersion.getMainAppCodeVersion().attrs.repo;
    return $http({
      method: 'get',
      url: configAPIHost + '/github/repos/' + repo + '/pulls?head=' + repo.split('/')[0] + ':' + branch
    }).then(function (pullRequests) {
      return keypather.get(pullRequests, 'data[0]');
    });
  };
}

function fetchDebugContainer(
  fetchUser,
  promisify
) {
  return function (containerId) {
    return fetchUser().then(function (user) {
      return promisify(user, 'fetchDebugContainer')(containerId);
    });
  };
}

function fetchStackData(
  $log,
  fetchStackAnalysis,
  fetchStackInfo,
  hasKeypaths
) {
  return function (repo) {
    function setStackSelectedVersion(stack, versions) {
      if (versions[stack.key]) {
        stack.suggestedVersion = versions[stack.key];
      }
      if (stack.dependencies) {
        stack.dependencies.forEach(function (childStack) {
          setStackSelectedVersion(childStack, versions);
        });
      }
    }
    return fetchStackInfo()
      .then(function (stacks) {
        return fetchStackAnalysis(repo.attrs.full_name)
          .then(function (data) {
            if (!data.languageFramework) {
              $log.warn('No language detected');
              return;
            }
            if (data.languageFramework === 'ruby_ror') {
              data.languageFramework = 'rails';
            }
            repo.stackAnalysis = data;

            var stack = stacks.find(hasKeypaths({
              'key': data.languageFramework.toLowerCase()
            }));
            if (stack) {
              setStackSelectedVersion(stack, data.version);
              return stack;
            }
          });
      });
  };
}

function fetchPlan(
  $http,
  memoize,
  configAPIHost,
  currentOrg
) {
  return memoize(function () {
    return $http({
      method: 'get',
      url: configAPIHost + '/billing/plan',
      params: {
        organizationId: currentOrg.poppa.id()
      }
    })
      .then(function (res) {
        return res.data;
      });
  }, function () {
    return currentOrg.poppa.id();
  });
}

function fetchInvoices(
  $http,
  configAPIHost,
  currentOrg,
  keypather,
  memoize
) {
  return memoize(function () {
    return $http({
      method: 'get',
      url: configAPIHost + '/billing/invoices',
      params: {
        organizationId: currentOrg.poppa.id()
      }
    })
      .then(function (res) {
        return keypather.get(res, 'data.invoices');
      });
  }, function () {
    return currentOrg.poppa.id();
  });
}

function fetchPaymentMethod(
  $http,
  memoize,
  configAPIHost,
  currentOrg
) {
  return memoize(function () {
    console.log('Actually fetching payment method;');
    return $http({
      method: 'get',
      url: configAPIHost + '/billing/payment-method',
      params: {
        organizationId: currentOrg.poppa.id()
      }
    })
      .then(function (res) {
        return res.data;
      });
  }, function () {
    return currentOrg.poppa.id();
  });
}
