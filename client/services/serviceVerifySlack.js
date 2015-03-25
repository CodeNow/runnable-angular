'use strict';

require('app')
  .factory('verifyChatIntegration', verifyChatIntegration);

function verifyChatIntegration (
  fetchSlackMembers,
  fetchGitHubMembers,
  fetchGitHubUser,
  keypather,
  integrationsCache,
  $state,
  $q
) {
  return function (settings, chatClient) {
    var mData = {};
    var matches = [];
    var members;
    return $q.all({
      chat: fetchSlackMembers(settings.attrs.notifications[chatClient].apiToken),
      github: fetchGitHubMembers($state.params.userName)
    })
    .then(function(_members) {
      members = _members;
      // Fetch actual names
      var memberFetchPromises = members.github.map(function (user) {
        return fetchGitHubUser(user.login).then(function (ghUser) {
          members.chat.forEach(function (member) {

            if (member.real_name && member.real_name.toLowerCase() === keypather.get(ghUser, 'name.toLowerCase()')) {
              // TODO: handle case with multiple users of the same name
              member.found = true;
              member.ghName = ghUser.login;
              matches.push(ghUser.login);
            }
            if (keypather.get(settings, 'attrs.notifications.' + chatClient + '.githubUsernameToSlackIdMap.' + ghUser.login) ===
              member.id) {
              member.slackOn = true;
              member.ghName = ghUser.login;
            }
          });
          return ghUser;
        });
      });

      return $q.all(memberFetchPromises);
    })
    .then(function(ghMembers) {
      // Using .reduce here because all we care about is member.login
      var filteredGhMembers = ghMembers.reduce(function(arr, member) {
        if (member.login && matches.indexOf(member.login) === -1) {
          arr.push(member.login);
        }
        return arr;
      }, []);

      return {
        githHub: filteredGhMembers,
        slack: members.chat
      };
    });
  };
}