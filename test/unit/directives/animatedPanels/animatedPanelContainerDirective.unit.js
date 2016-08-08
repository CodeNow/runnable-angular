'use strict';

describe('animatedPanelContainerDirective'.bold.underline.blue, function() {
  var $compile;
  var $scope;
  var $elScope;
  var $rootScope;
  var $timeout;
  function setup() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
    });

    var template = directiveTemplate('animated-panel-container');
    var element = $compile(template)($scope);
    $scope.$digest();
    $elScope = element.scope();
    $scope.$digest();
  }

  beforeEach(function () {
    setup();
  });

  describe('register panel', function () {
    it('should set the default panel', function () {
      $elScope.registerPanel('panel-name', [{}], true);
      $elScope.$digest();
      expect($elScope.activePanel).to.equal('panel-name');
    });
  });

  describe('animated panel style', function () {
    it('should get the height/width of the active panel', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], true);
      $elScope.goToPanel('panel-name', 'back');
      $elScope.$digest();
      var size = $elScope.getAnimatedPanelStyle();
      expect(size.height).to.equal('11px');
      expect(size.width).to.equal('12px');
    });
    it('should return relative if not actively animating', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], true);
      $elScope.$digest();
      var style = $elScope.getAnimatedPanelStyle();
      expect(style.position).to.equal('relative');
    });
  });

  describe('getPanelClass', function () {
    it('should return the right classes for a panel that is active', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], true);
      $elScope.$digest();
      var classes = $elScope.getPanelClass('panel-name');
      expect(classes.in, 'in').to.be.ok;
      expect(classes.out, 'out').to.not.be.ok;
    });

    it('should return the right classes for a panel that is out', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], false);
      $elScope.$digest();
      var classes = $elScope.getPanelClass('panel-name');
      expect(classes.in, 'in').to.not.be.ok;
      expect(classes.out, 'out').to.be.ok;
      expect(classes.animated, 'animated').to.not.be.ok;
      expect(classes.back, 'back').to.not.be.ok;
    });

    it('should reverse the direction if the panel is currently leaving', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], false);
      $elScope.registerPanel('panel-name1', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], true);

      $elScope.goToPanel('panel-name');
      $elScope.$digest();
      $timeout.flush();
      var classes = $elScope.getPanelClass('panel-name1');
      expect(classes.in, 'in').to.not.be.ok;
      expect(classes.out, 'out').to.be.ok;
      expect(classes.animated, 'animated').to.be.ok;
      expect(classes.back, 'back').to.be.ok;
    });
  });
  describe('go-to-panel event', function () {
    it('should pass through to goToPanel', function () {
      $elScope.goToPanel = sinon.spy();
      $elScope.$broadcast('go-to-panel', 1, 2);
      sinon.assert.calledOnce($elScope.goToPanel);
      sinon.assert.calledWith($elScope.goToPanel, 1, 2);
    });
  });
  describe('goToPanel', function () {
    it('should throw an error when we try to go to a panel that doesn\'t exist', function () {
      sinon.spy(console, 'error');
      $elScope.goToPanel('Whoa');
      sinon.assert.calledOnce(console.error);
      sinon.assert.calledWith(console.error, 'Tried going to panel that doesn\'t exist', 'Whoa');
      console.error.restore();
    });
    it('should not enable animating when style is immediate', function () {
      $elScope.registerPanel('panel-name', [{
        offsetHeight: 11,
        offsetWidth: 12
      }], false);
      $elScope.goToPanel('panel-name', 'immediate');
      $timeout.flush();
      var classes = $elScope.getPanelClass('panel-name');
      expect(classes.animated, 'animated').to.not.be.ok;
    });
  })
});
