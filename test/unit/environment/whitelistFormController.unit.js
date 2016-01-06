'use strict';

var $controller;
var $rootScope;
var $scope;
var whitelistFormController;


describe.only('WhitelistFormController'.bold.underline.blue, function () {
  function setup() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });
    whitelistFormController = $controller('WhitelistFormController', {
      '$scope': $scope
    });
  }

  beforeEach(setup);

  describe('basics'.blue, function () {

    it('should exist', function () {
      expect(whitelistFormController, 'whitelistFormController').to.be.ok;
      expect(whitelistFormController.isRange, 'isRange').to.equal(false);
    });
  });

  describe('actions', function () {
    describe('add', function () {
      it('should add an ip to the whitelist', function () {
        whitelistFormController.fromAddress = '123.123.123.123';
        whitelistFormController.toAddress = '124.124.124.124';
        whitelistFormController.isRange = false;
        whitelistFormController.description = 'Description!';
        whitelistFormController.whitelist = [];
        whitelistFormController.actions.add();
        expect(whitelistFormController.whitelist.length).to.equal(1);
        expect(whitelistFormController.whitelist[0]).to.deep.equal({
          address: ['123.123.123.123'],
          description: 'Description!'
        });
        expect(whitelistFormController.fromAddress).to.equal('');
        expect(whitelistFormController.toAddress).to.be.equal('');
        expect(whitelistFormController.isRange).to.not.be.ok;
        expect(whitelistFormController.description).to.be.equal('');
      });
      it('should add an ip range to the whitelist', function () {
        whitelistFormController.fromAddress = '123.123.123.123';
        whitelistFormController.toAddress = '124.124.124.124';
        whitelistFormController.isRange = true;
        whitelistFormController.description = 'Description!';
        whitelistFormController.whitelist = [];
        whitelistFormController.actions.add();
        expect(whitelistFormController.whitelist.length).to.equal(1);
        expect(whitelistFormController.whitelist[0]).to.deep.equal({
          address: ['123.123.123.123', '124.124.124.124'],
          description: 'Description!'
        });
        expect(whitelistFormController.fromAddress).to.equal('');
        expect(whitelistFormController.toAddress).to.be.equal('');
        expect(whitelistFormController.isRange).to.not.be.ok;
        expect(whitelistFormController.description).to.be.equal('');
      });
    });
    describe('remove', function () {
      it('should remove the ip from the list', function () {
        whitelistFormController.whitelist = [];
        var ip = {
          address: ['123.123.123.123', '124.124.124.124'],
          description: 'Description!'
        };
        whitelistFormController.whitelist.push(ip);
        whitelistFormController.actions.remove(ip);
        expect(whitelistFormController.whitelist.length).to.equal(0);
      });
    });
  });
});
