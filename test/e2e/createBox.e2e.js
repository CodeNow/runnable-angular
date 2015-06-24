'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var users = require('./helpers/users');
var NewContainer = require('./popovers/NewContainer');
var RepoSelect = require('./modals/RepoSelect');
var VerifyServerSelection = require('./modals/VerifyServerSelection');
var ServerCard = require('./components/serverCard');

var containers = [{
  repo: 'web',
  stackType: 'Node.js',
  version: 'v0.10.35',
  buildCommandsButton: 'npm install',
  containerCommand: 'npm start'
}];

describe('project creation workflow', function () {
  var originalTimeout;
  beforeEach(function () {
    jasmine.getEnv().defaultTimeoutInterval  = 1000 * 60 * 3;
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  afterEach(function () {
    jasmine.getEnv().defaultTimeoutInterval = originalTimeout;
  });
  containers.forEach(function (container) {
    it('should create new container', function () {

      var newContainer = new NewContainer();
      var repoSelect = new RepoSelect();
      var verifyServerSelection = new VerifyServerSelection();
      return newContainer.selectRepository()
        .then(function () {
          return repoSelect.selectRepo(container.repo);
        })
        .then(function () {
          return verifyServerSelection.selectSuggestedStackType({firstTime: true});
        })
        .then(function () {
          return verifyServerSelection.selectSuggestedVersion();
        })
        .then(function () {
          return verifyServerSelection.getBuildCommands();
        })
        .then(function (buildCommands) {
          expect(buildCommands).toEqual(container.buildCommandsButton);
          return verifyServerSelection.selectSuggestedContainerCommand();
        })
        .then(function () {
          return verifyServerSelection.createContainerButton.get().click();
        })
        .then(function () {
          var serverCard = new ServerCard(container.repo);
          return serverCard.waitForStatusEquals('running');
        });
    });
  });
});
