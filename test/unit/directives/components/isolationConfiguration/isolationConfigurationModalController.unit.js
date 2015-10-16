'use strict';

var $scope;
var $controller;
var $elScope;
var $rootScope;
var instances = require('../../../apiMocks').instances;
var runnable = window.runnable;

describe('IsolationConfigurationModalController'.bold.underline.blue, function() {
  var ICMC;
  var mockInstance;
  var mockClose;
  var mockInstancesByPod;
  var mockFetchInstancesByPod;
  var mockCreateIsolation;

  function injectSetupCompile () {
    mockClose = sinon.spy();
    mockInstance = {
      attrs: {
        contextVersion: {
          context: 'context1234'
        },
        owner: {
          username: 'orgName'
        }
      },
      getRepoName: sinon.stub().returns('mainRepo')
    };
    mockInstancesByPod = {
      models: [
        mockInstance,
        {
          attrs: {
            contextVersion: {
              context: '1'
            },
            owner: {
              username: 'orgName'
            }
          },
          getRepoName: sinon.stub().returns('foo'),
          getBranchName: sinon.stub().returns('master')
        },
        {
          attrs: {
            contextVersion: {
              context: '2'
            },
            owner: {
              username: 'orgName'
            }
          },
          getRepoName: sinon.stub().returns('foo1'),
          getBranchName: sinon.stub().returns('master1')
        },
        {
          attrs: {
            contextVersion: {
              context: '3'
            },
            owner: {
              username: 'orgName'
            }
          },
          getRepoName: sinon.stub().returns('foo2'),
          getBranchName: sinon.stub().returns('master2')
        },
        {
          id: sinon.stub().returns('1234'),
          attrs: {
            contextVersion: {
              context: '4'
            }
          },
          getRepoName: sinon.spy()
        }
      ]
    };

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('instance', mockInstance);
      $provide.value('close', mockClose);
      $provide.factory('createIsolation', function ($q) {
        mockCreateIsolation = sinon.stub().returns($q.when('created isolation!'));
        return mockCreateIsolation;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        mockFetchInstancesByPod = sinon.stub().returns($q.when(mockInstancesByPod));
        return mockFetchInstancesByPod;
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$controller_
    ) {
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });


    var laterController = $controller('IsolationConfigurationModalController', {
      $scope: $scope
    }, true);

    ICMC = laterController();
  }

  beforeEach(injectSetupCompile);

  it('should fetch and filter the instances', function () {
    $scope.$digest();
    sinon.assert.calledOnce(mockFetchInstancesByPod);
    expect(ICMC.repoInstances.length).to.equal(3);
    expect(ICMC.nonRepoInstances.length).to.equal(1);
    expect(Object.keys(ICMC.instanceBranchMapping).length).to.equal(3);
  });

  describe('createIsolation', function () {
    it('should create a new isolation', function () {
      $scope.$digest();
      ICMC.createIsolation();
      $scope.$digest();
      sinon.assert.calledOnce(mockCreateIsolation);
      sinon.assert.calledWith(mockCreateIsolation, mockInstance);
      sinon.assert.calledOnce(mockClose);
      var createList = mockCreateIsolation.lastCall.args[1];
      expect(createList).to.deep.equal([
        {
          repo: 'foo',
          branch: 'master',
          org: 'orgName'
        },
        {
          repo: 'foo1',
          branch: 'master1',
          org: 'orgName'
        },
        {
          repo: 'foo2',
          branch: 'master2',
          org: 'orgName'
        },
        '1234'
      ]);
    });
  })

});