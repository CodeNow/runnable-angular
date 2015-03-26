'use strict';

var util = require('./helpers/util');
var users = require('./helpers/users');
var InstancePage = require('./pages/InstancePage');
var InstanceEditPage = require('./modals/InstanceEditModal');
var apiClient = require('./helpers/apiClient');
var BUILD_TIMEOUT = 80000;
var user, oldBuildId;

function startInstanceUpdate(thisUser) {
  oldBuildId = null;
  return function () {
    var forkedBuild, thisInstance;
    return apiClient.fetchUser(
    ).then(function (_user) {
      user = _user;
      return apiClient.promisify(user, 'fetch')('me');
    }).then(function () {
      return apiClient.promisify(user, 'fetchInstances')({
        githubUsername: thisUser,
        name: 'RailsProject'
      });
    }).then(function (instances) {
      thisInstance = instances.models[0];
      oldBuildId = thisInstance.build.id();
      return apiClient.promisify(thisInstance.build, 'deepCopy')();
    }).then(function (build) {
      forkedBuild = build;
      return apiClient.promisify(forkedBuild, 'build')({
        message: 'Manual build',
        noCache: true
      });
    }).then(function () {
      return apiClient.promisify(thisInstance, 'update')({
        build: forkedBuild.id()
      });
    }).then(function () {
      return forkedBuild;
    });
  };
}
describe('watchBuildLogs', users.doMultipleUsers(function (username) {
  it('should react to a socket update of the build when running', function () {
    var instance = new InstancePage('RailsProject');
    instance.get();

    browser.wait(function () {
      return instance.statusIcon.get().isPresent();
    });
    browser.wait(function () {
      return instance.activePanel.isLoaded();
    }).then(function () {
      instance.activePanel.openTab('Build Logs');
    }).then(instance.activePanel.currentContent.get().getText
    ).then(function (text) {
      expect(text).toMatch(/Successfully built/);
    }).then(function () {
      return browser.wait(function () {
        return instance.activePanel.isLoaded();
      });
    }).then(function () {
      return instance.activePanel.openTab('Web View');
    }).then(function () {
      return browser.wait(function () {
        return util.hasClass(instance.statusIcon, 'running');
      });
    }).then(startInstanceUpdate(username));

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'building');
    });

    browser.wait(function () {
      return instance.activePanel.isLoaded();
    }).then(function () {
      expect(instance.activePanel.getActiveTab()).toEqual('Build Logs');
    });

    // Removing until backend fixes key issue
    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    }, BUILD_TIMEOUT);
  }, BUILD_TIMEOUT);
  it('should react to a socket update of the build when stopped', function () {
    var instance = new InstancePage('RailsProject');
    instance.get();

    browser.wait(function () {
      return instance.statusIcon.get().isPresent();
    });
    browser.wait(function () {
      return instance.activePanel.isLoaded();
    }).then(function () {
      return instance.gearMenu.openIfClosed();
    }).then(function () {
      return instance.gearMenu.stopRunning.get().click();
    }).then(function () {
      return browser.wait(function () {
        return util.hasClass(instance.statusIcon, 'stopped');
      });
    }).then(function () {
      return browser.wait(function () {
        return instance.activePanel.getContents().then(function (text) {
          return text.indexOf('Exited') >= 0;
        });
      });
    }).then(startInstanceUpdate(username));

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'building');
    });

    browser.wait(function () {
      return instance.activePanel.isLoaded();
    }).then(function () {
      expect(instance.activePanel.getActiveTab()).toEqual('Build Logs');
    });

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    }, BUILD_TIMEOUT);
  }, BUILD_TIMEOUT);
  it('should react to a socket update of the build when building', function () {
    var newBuild = null;
    var instanceEdit = new InstanceEditModal('RailsProject');
    var instance = new InstancePage('RailsProject');
    instanceEdit.get();

    browser.wait(function () {
      return instanceEdit.activePanel.isLoaded();
    });
    instanceEdit.buildWithoutCache();
    util.waitForUrl(InstancePage.urlRegex());
    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'building');
    });

    browser.wait(function () {
      return instance.activePanel.getContents().then(function (text) {
        return text.indexOf('Step 0') >= 0;
      });
    }).then(
      startInstanceUpdate(username)
    ).then(function (forkedBuild) {
      newBuild = forkedBuild;
      return browser.wait(function () {
        return instance.activePanel.getContents().then(function (text) {
          // Testing for JUST the spinner
          return /^\||\-|\/|\\/.test(text);
        });
      });
    }).then(function () {
      browser.wait(function () {
        return instance.activePanel.getContents().then(function (text) {
          return text.indexOf('Step 3') >= 0;
        });
      });
    }).then(function () {
      return apiClient.promisify(user, 'fetchInstances')({
        githubUsername: username,
        name: 'RailsProject'
      });
    }).then(function (instances) {
      var thisBuildId = instances.models[0].build.id();
      expect(thisBuildId).toEqual(newBuild.id());
      expect(thisBuildId).not.toEqual(oldBuildId);
    });

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    }, BUILD_TIMEOUT);
  }, BUILD_TIMEOUT);
}));