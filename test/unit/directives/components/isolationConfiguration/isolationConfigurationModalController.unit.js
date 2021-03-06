'use strict';

var $scope;
var $controller;
var $elScope;
var $rootScope;
var instances = require('../../../apiMocks').instances;
var runnable = window.runnable;

describe('IsolationConfigurationModalController'.bold.underline.blue, function() {
  var ICMC;
  var mockInstancesByPodId;
  var mockInstance;
  var mockClose;
  var mockInstancesByPod;
  var mockFetchInstancesByPod;
  var mockCreateIsolation;

  function injectSetupCompile () {
    mockClose = sinon.spy();
    mockInstancesByPodId = 'b';
    mockInstance = {
      id: sinon.stub().returns('a'),
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
          id: sinon.stub().returns(mockInstancesByPodId),
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
          id: sinon.stub().returns('c'),
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
          id: sinon.stub().returns('d'),
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
          id: sinon.stub().returns('e'),
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
      ICMC.instanceCheckboxes.b = true;
      ICMC.instanceCheckboxes.e = true;
      ICMC.instanceCheckboxes.d = false;
      ICMC.createIsolation();
      $scope.$digest();
      sinon.assert.calledOnce(mockCreateIsolation);
      sinon.assert.calledWith(mockCreateIsolation, mockInstance);
      sinon.assert.calledOnce(mockClose);
      var createList = mockCreateIsolation.lastCall.args[1];
      expect(createList).to.deep.equal([{
          instance: mockInstancesByPodId,
          branch: 'master',
        },
        {
          instance: 'e'
        }
      ]);
    });
  });
});
