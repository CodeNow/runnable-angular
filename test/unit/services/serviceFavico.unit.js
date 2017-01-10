'use strict';

describe('serviceFavico'.bold.underline.blue, function () {
  var favico;
  var favjsMock;
  function initState () {
    favjsMock = {
      reset: sinon.spy(),
      image: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('favicojs', function (obj) {
        expect(obj).to.deep.equal({
          animation: 'none'
        });
        return favjsMock;
      });
    });

    angular.mock.inject(function (_favico_) {
      favico = _favico_;
    });
  }
  beforeEach(initState);

  it('should call reset', function () {
    favico.reset();
    sinon.assert.called(favjsMock.reset);
  });

  it('should set state based on instance', function () {
    var theSrc = new RegExp('build/images/favicon-orange.png');
    favico.setInstanceState({
      getRepoName: sinon.stub().returns('1234'),
      status: function () {
        return 'building';
      }
    });
    // Need to compare exact srcs, so sinon.assert isn't helpful
    expect(favjsMock.image.getCall(0).args[0].src).to.match(theSrc);
  });

  it('does not change anything if state is the same', function () {
    favico.setInstanceState({
      getRepoName: sinon.stub().returns('1234'),
      status: function () {
        return 'building';
      }
    });
    favico.setInstanceState({
      getRepoName: sinon.stub().returns('1234'),
      status: function () {
        return 'building';
      }
    });
    sinon.assert.calledOnce(favjsMock.image);
  });

  it('should reset on weird states', function () {
    favico.setInstanceState({
      getRepoName: sinon.stub().returns('1234'),
      status: function () {
        return 'I like turtles';
      }
    });
    sinon.assert.called(favjsMock.reset);
  });

  describe('when testing', function () {
    it('should return orange when status is running', function () {
      var theSrc = new RegExp('build/images/favicon-orange.png');
      favico.setInstanceState({
        getRepoName: sinon.stub().returns('1234'),
        attrs: { isTesting: true },
        status: sinon.stub().returns('running')
      });
      // Need to compare exact srcs, so sinon.assert isn't helpful
      expect(favjsMock.image.getCall(0).args[0].src).to.match(theSrc);
    });

    it('should return green when status is stopped', function () {
      var theSrc = new RegExp('build/images/favicon-green.png');
      favico.setInstanceState({
        getRepoName: sinon.stub().returns('1234'),
        attrs: { isTesting: true },
        status: sinon.stub().returns('stopped')
      });
      // Need to compare exact srcs, so sinon.assert isn't helpful
      expect(favjsMock.image.getCall(0).args[0].src).to.match(theSrc);
    });
  });

});
