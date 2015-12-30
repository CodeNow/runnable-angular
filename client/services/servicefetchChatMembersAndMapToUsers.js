'use strict';

require('app')
  .factory('fetchChatMembersAndMapToUsers', fetchChatMembersAndMapToUsers);

function fetchChatMembersAndMapToUsers (
  verifySlackAPITokenAndFetchMembers,
  fetchGitHubMembers,
  fetchGitHubUser,
  keypather,
  integrationsCache,
  $state,
  $q
) {
  // Only Slack for now, will expand when customers request it
  return function (apiToken, settings, chatClient) {
    var orgName = $state.params.userName;

    var cacheToken = keypather.get(integrationsCache, orgName + '.' + chatClient + '.apiToken');
    if (apiToken === cacheToken && integrationsCache[orgName].github) {
      return $q.when(integrationsCache[orgName]);
    }
    var matches = [];
    var members;
    return $q.all({
      chat: verifySlackAPITokenAndFetchMembers(apiToken),
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
              var propertyName = 'attrs.notifications.' + chatClient + '.githubUsernameToSlackIdMap.' + ghUser.login;
              if (keypather.get(settings, propertyName) === member.id) {
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

        integrationsCache[orgName].github = filteredGhMembers;
        integrationsCache[orgName].slack = members.chat;

        return integrationsCache[orgName];
      });
  };
}
