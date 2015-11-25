/*global expect:true */
'use strict';
var mockUserFetch = new (require('../fixtures/mockFetch'))();

var $controller;
var $scope;
var $q;

describe.only('InviteModalController'.bold.underline.blue, function () {

  var IMC;
  var fetchUserStub;

  beforeEach(function (done) {

    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchUser', mockUserFetch.fetch());
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _$timeout_
    ) {
      $controller = _$controller_;
      $scope = _$rootScope_.$new();
      $q = _$q_;
    });

    IMC = $controller('InviteModalController', { $scope: $scope }, true)();
  });

  it('should set the right variables and call the right methods on init', function () {
    expect(IMC.sending).to.equal(false);
    expect(IMC.invitesSent).to.equal(0);
    expect(IMC.activeUserIndex).to.equal(null);
    expect(IMC.sendingInviteUserIndex).to.equal(null);
  });

});
