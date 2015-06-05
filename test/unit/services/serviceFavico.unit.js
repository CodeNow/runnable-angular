'use strict';

describe('serviceFavico'.bold.underline.blue, function () {
  var favico;
  var favjsMock;
  var instanceStatusMock;
  var instanceStatusValue;
  function initState () {
    favjsMock = {
      reset: sinon.spy(),
      image: sinon.spy()
    };
    instanceStatusMock = sinon.spy(function () {
      return instanceStatusValue;
    });
    angular.mock.module('app', function ($provide) {
      $provide.value('favicojs', function (obj) {
        expect(obj).to.deep.equal({
          animation: 'none'
        });
        return favjsMock;
      });
      $provide.value('instanceStatus', instanceStatusMock);
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
      status: function () {
        return 'building';
      }
    });
    // Need to compare exact srcs, so sinon.assert isn't helpful
    expect(favjsMock.image.getCall(0).args[0].src).to.match(theSrc);
  });

  it('does not change anything if state is the same', function () {
    favico.setInstanceState({
      status: function () {
        return 'building';
      }
    });
    favico.setInstanceState({
      status: function () {
        return 'building';
      }
    });
    sinon.assert.calledOnce(favjsMock.image);
  });

  it('should reset on weird states', function () {
    instanceStatusValue = 'HARGBLARGEN';
    favico.setInstanceState({
      status: function () {
        return 'I like turtles';
      }
    });
    sinon.assert.called(favjsMock.reset);
  });

});
