'use strict';

module.exports = function (githubOrgName, githubOrgId) {
  if (!githubOrgName) {
    githubOrgName = 'CodeNow';
  }
  if (!githubOrgId) {
    githubOrgId = 1223344;
  }
  return {
    avatar_url: 'https://avatars.githubusercontent.com/u/' + githubOrgId + '?v=3',
    description: null,
    events_url: 'https://api.github.com/orgs/' + githubOrgName + '/events',
    id: githubOrgId,
    login: githubOrgName,
    members_url: 'https://api.github.com/orgs/' + githubOrgName + '/members{/member}',
    public_members_url: 'https://api.github.com/orgs/' + githubOrgName + '/public_members{/member}',
    repos_url: 'https://api.github.com/orgs/' + githubOrgName + '/repos',
    url: 'https://api.github.com/orgs/' + githubOrgName + ''
  };
};

