'use strict';

var util = require('./helpers/util');
var users = require('./helpers/users');
var InstancePage = require('./pages/InstancePage');
var InstanceEditPage = require('./pages/InstanceEditPage');
var apiClient = require('./helpers/apiClient');
var BUILD_TIMEOUT = 80000;

function startInstanceUpdate(thisUser) {
  return function () {
    var forkedBuild, thisInstance, user;
    return apiClient.fetchUser(
    ).then(function (_user) {
      user = _user;
      return apiClient.promisify(user, 'fetch')('me');
    }).then(function () {
      return apiClient.promisify(user, 'fetchInstances')({
        githubUsername: thisUser
      });
    }).then(function (instances) {
      thisInstance = instances.find(function (instance) {
        return instance.attrs.name === 'node_hello_world';
      });
      return thisInstance;
    }).then(function (instance) {
      return instance.build;
    }).then(function (build) {
      return apiClient.promisify(build, 'deepCopy')();
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
    });
  };
}
describe('watchBuildLogs', users.doMultipleUsers(function (username) {
  it('should react to a socket update of the build when running', function () {
    var instance = new InstancePage('node_hello_world');
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
    var instance = new InstancePage('node_hello_world');
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
    var instanceEdit = new InstanceEditPage('node_hello_world');
    var instance = new InstancePage('node_hello_world');
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
        return text.indexOf('Step 3') >= 0;
      });
    }).then(startInstanceUpdate(username)
    ).then(function () {
        expect(instance.activePanel.getContents()).not.toMatch('Step 3');
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
}))