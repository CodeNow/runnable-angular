/*global angular:true */
'use strict';
module.exports = function (githubUsername, githubgithubUserId, methods) {
 if (!githubUsername) {
    githubUsername = 'thejsj';
  }
  if (!githubgithubUserId) {
    githubgithubUserId = 12345;
  }
  var user = {
    '_id': '54d3c216c0f345d650d00123',
    'accounts': {
      'github': {
        'provider': 'github',
        'id': githubgithubUserId,
        'displayName': 'Jorge Silva',
        'username': githubUsername,
        'profileUrl': 'https:\/\/github.com\/' + githubUsername,
        'emails': [
          {
            'value': 'jorge.silva@thejsj.com'
          }
      ]
      }
    },
    'gravatar': 'https:\/\/avatars.githubusercontent.com\/u\/1981198?v=3',
    'email': 'email@company.com',
    'routes': [ ],
    'created': '2015-02-18T00:00:00.000Z',
    'showEmail': false
  };
  return angular.extend(user, methods);
};

