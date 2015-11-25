'use strict';

module.exports = function (githubUsername, githubUserId) {
if (!githubUsername) {
  githubUsername = 'thejsj';
}
if (!githubUserId) {
  githubUserId = 12345;
}
return {
  avatar_url: 'https://avatars.githubusercontent.com/u/1981198?v=3',
  events_url: 'https://api.github.com/users/' + githubUsername + '/events{/privacy}',
  followers_url: 'https://api.github.com/users/' + githubUsername + '/followers',
  following_url: 'https://api.github.com/users/' + githubUsername + '/following{/other_user}',
  gists_url: 'https://api.github.com/users/' + githubUsername + '/gists{/gist_id}',
  gravatar_id: '',
  html_url: 'https://github.com/' + githubUsername,
  id: githubUserId,
  login: githubUsername,
  organizations_url: 'https://api.github.com/users/' + githubUsername + '/orgs',
  received_events_url: 'https://api.github.com/users/' + githubUsername + '/received_events',
  repos_url: 'https://api.github.com/users/' + githubUsername + '/repos',
  site_admin: false,
  starred_url: 'https://api.github.com/users/' + githubUsername + '/starred{/owner}{/repo}',
  subscriptions_url: 'https://api.github.com/users/' + githubUsername + '/subscriptions',
  type: 'User',
  url: 'https://api.github.com/users/' + githubUsername
  };
};
