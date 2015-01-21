'use strict';

describe('servicePrimus'.bold.underline.blue, function () {
  var primus;
  function initState () {

    angular.mock.module('app', function ($provide) {
      $provide.value('apiConfigHost', 'http://api.runnable3.net');
    });

    angular.mock.inject(function (_primus_) {
      primus = _primus_;
    });
  }
  beforeEach(initState);

  it('should connect to the server', function () {
    expect(primus).to.be.a('object');
  });

  it('should have substreams', function () {
    var sub = primus.substream('terminal');
    expect(sub).to.be.ok;
  });

  it('should create log streams', function() {
    var logStream = primus.createLogStream({
      attrs: {
        dockerContainer: '12345'
      }
    });
    expect(logStream).to.be.an('object');
  });

  it.skip('should create build streams', function() {
    var stream = primus.createBuildStream({
      contextVersions: {
        models: [
          {
            id: function () {
              return '12345';
            }
          }
        ]
      },
      json: function () {
        return '54321';
      }
    });
    expect(stream).to.be.an('object');
  });

  it('should create Term streams', function() {
    var stream = primus.createTermStreams('12345');
    expect(stream).to.be.an('object');
    expect(stream).to.have.property('termStream');
    expect(stream).to.have.deep.property('termStream.write');
    expect(stream).to.have.property('eventStream');
    expect(stream).to.have.deep.property('eventStream.write');
  });

});
