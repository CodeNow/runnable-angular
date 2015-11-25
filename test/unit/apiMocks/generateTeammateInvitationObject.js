'use strict';
var generateUserObject = require('./generateUserObject.js');
var generateGithubOrgObject = require('./gh/generateGithubOrgObject.js');

module.exports = function (orgGithubId, recipientGihtubId, recipientEmail) {
  var user = generateUserObject();
  if (!orgGithubId) {
    orgGithubId = generateGithubOrgObject().id;
  }
  if (!recipientGihtubId) {
    recipientGihtubId = user.id;
  }
  if (!recipientEmail) {
    recipientEmail = user.accounts.github.emails[0].value;
  }
  return {
    _id: '564e76f4ecb1e41e0096b5d7',
    created: '2015-11-20T01:27:16.193Z',
    organization: {
      github: orgGithubId
    },
    owner: {
      github: 1981198
    },
    recipient: {
      email: recipientEmail,
      github: recipientGihtubId
    }
  };
};
