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
          return serverCard.waitForStatusEquals(['running', 'building', 'starting']);
        });
    });
  });
  it('should have a help card to create a mongodb container', function () {
    var newContainer = new NewContainer();
    var nonRepoSelect = new NonRepoSelect();

    var serverCard = new ServerCard('api');
    return serverCard.waitForStatusEquals('running')
      .then(function () {
        helpCards.selectCardByText('api may need a mongodb container.');
      })
      .then(function () {
        return newContainer.selectNonRepository();
      })
      .then(function () {
        return nonRepoSelect.selectNonRepo('MongoDB');
      })
      .then(function () {
        var serverCard = new ServerCard('MongoDB');
        return serverCard.waitForStatusEquals('running');
      });
  });

  it('should have a help card to create a mapping to mongodb', function () {
    var helpCardText = util.createGetter(by.cssContainingText('.help-container .help', 'to update the hostname for'));

    var serverCard = new ServerCard('api');
    return serverCard.waitForStatusEquals('running')
      .then(function () {
        helpCards.selectCardByText('need to be updated with');
      })
      .then(function () {
        return helpCardText.get().isPresent()
          .then(function (isPresent) {
            expect(isPresent).toEqual(true);
          });
      });
  });
});
