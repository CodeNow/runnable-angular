'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var NewContainer = require('./popovers/NewContainer');
var RepoSelect = require('./modals/RepoSelect');
var NonRepoSelect = require('./modals/NonRepoSelect');
var VerifyServerSelection = require('./modals/VerifyServerSelection');
var ServerCard = require('./components/serverCard');

var HelpCards = require('./components/HelpCards');
var helpCards = new HelpCards();

var containers = [
  {
    repo: 'web',
    stackType: 'Node.js',
    version: 'v0.10.35',
    buildCommandsButton: 'npm install',
    containerCommand: 'npm start'
  },
  {
    repo: 'api',
    stackType: 'Node.js',
    version: 'v0.10.35',
    buildCommandsButton: 'npm install',
    containerCommand: 'npm start'
  }
];

describe('project creation workflow', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  containers.forEach(function (container) {
    it('should create new container '+container.repo, function () {
      var newContainer = new NewContainer();
      var repoSelect = new RepoSelect();
      var verifyServerSelection = new VerifyServerSelection();
      newContainer.selectRepository();
      repoSelect.selectRepo(container.repo);
      verifyServerSelection.selectSuggestedStackType({firstTime: true});
      verifyServerSelection.selectSuggestedVersion();
      expect(verifyServerSelection.getBuildCommands()).toContain(container.buildCommandsButton);
      verifyServerSelection.selectSuggestedContainerCommand();
      verifyServerSelection.createContainerButton.get().click();
      return new ServerCard(container.repo).waitForStatusEquals(['running', 'building', 'starting']);
    });
  });
  it('should have a help card to create a mongodb container', function () {
    var newContainer = new NewContainer();
    var nonRepoSelect = new NonRepoSelect();
    new ServerCard('api').waitForStatusEquals(['starting', 'running', 'building'])
      .then(function () {
        helpCards.selectCardByText('api may need a mongodb container.');
        newContainer.selectNonRepository();
        nonRepoSelect.selectNonRepo('MongoDB');
        return new ServerCard('MongoDB').waitForStatusEquals('running', 'building', 'starting');
      });
  });

  it('should have a help card to create a mapping to mongodb', function () {
    var helpCardText = util.createGetter(by.cssContainingText('.help-container .help', 'to update the hostname for'));
    new ServerCard('api').waitForStatusEquals(['running', 'starting', 'building'])
      .then(function () {
        return new ServerCard('MongoDB').waitForStatusEquals(['running', 'starting', 'building']);
      })
      .then(function () {
        helpCards.selectCardByText('need to be updated with');
        expect(helpCardText.get().isPresent()).toEqual(true);
      });
  });
});
