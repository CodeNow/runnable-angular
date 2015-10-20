'use strict';

var $rootScope;
var streamingLog;
var moment = require('moment');
var EventEmitter = require('events').EventEmitter;
describe('streamingLogService'.blue.underline.bold, function () {
  var refreshAngularSpy;
  var mockDebounce;
  var stream;

  beforeEach(function () {
    mockDebounce = sinon.spy(function (cb) {
      return refreshAngularSpy = sinon.spy(function () {
        cb();
      });
    });
    stream = new EventEmitter();
    sinon.spy(stream, 'on');
    stream.off = sinon.spy();

    angular.mock.module('app', function ($provide) {
      $provide.value('debounce', mockDebounce);
    });
    angular.mock.inject(function (
      _$rootScope_,
      _streamingLog_
    ) {
      streamingLog = _streamingLog_;
      $rootScope = _$rootScope_;
      $rootScope.featureFlags = {
        debugMode: true,
        updatedBuildLogs: true
      };
      $rootScope.$apply();
    });
  });

  it('should return an object containing stream times and should contract the previous command', function () {
    var streamLogData = streamingLog(stream);

    var streamOfData = [
      {
        type: 'log',
        content: 'Step 1 : This is a step!\n',
        timestamp: moment().subtract(2,'hours').format()
      },
      {
        type: 'log',
        content: 'Temp Log Data 1\n',
        timestamp: moment().subtract(1.5,'hours').format()
      },
      {
        type: 'log',
        content: 'Temp Log Data 3\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: 'Step 2 : This is a step!\n',
        timestamp: moment().subtract(.5,'hours').format()
      }
    ];
    streamOfData.forEach(function (data) {
      stream.emit('data', data);
    });

    stream.emit('end');

    sinon.assert.calledOnce(mockDebounce);
    sinon.assert.called(refreshAngularSpy);

    expect(streamLogData.logs.length).to.equal(2);
    expect(streamLogData.logs[0].expanded).to.equal(false);
    expect(streamLogData.logs[1].expanded).to.equal(true);
    expect( moment( streamLogData.times.latest ).format() ).to.equal(streamOfData[3].timestamp);
    expect( moment( streamLogData.times.start ).format() ).to.equal(streamOfData[0].timestamp);
  });

  it('should mark command as cached and add the image id', function () {
    var streamLogData = streamingLog(stream);

    var streamOfData = [
      {
        type: 'log',
        content: 'Step 1 : This is a step!\n',
        timestamp: moment().subtract(2,'hours').format()
      },
      {
        type: 'log',
        content: ' ---> Using cache\n',
        timestamp: moment().subtract(1.5,'hours').format()
      },
      {
        type: 'log',
        content: ' ---> 321654987321\n',
        timestamp: moment().subtract(21,'hours').format()
      }
    ];
    streamOfData.forEach(function (data) {
      stream.emit('data', data);
    });

    stream.emit('end');

    sinon.assert.calledOnce(mockDebounce);
    sinon.assert.called(refreshAngularSpy);

    expect(streamLogData.logs[0].cached).to.be.ok;
    expect(streamLogData.logs[0].imageId).to.equal('321654987321');
  });
  it('should ignore certain commands', function () {
    var streamLogData = streamingLog(stream);

    var streamOfData = [
      {
        type: 'log',
        content: 'Step 1 : This is a step!\n',
        timestamp: moment().subtract(2,'hours').format()
      },
      {
        type: 'log',
        content: ' ---> Using cache\n',
        timestamp: moment().subtract(1.5,'hours').format()
      },
      {
        type: 'log',
        content: ' ---> 321654987321\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: 'Runnable: Build completed successfully!\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: ' ---> Running in 321654987321\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: 'Successfully built 321654987321\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: ' Actual message\n',
        timestamp: moment().subtract(21,'hours').format()
      }
    ];
    streamOfData.forEach(function (data) {
      stream.emit('data', data);
    });

    stream.emit('end');
    expect(streamLogData.logs[0].hasContent).to.be.ok;
    expect(streamLogData.logs[0].unprocessedContent.length).to.equal(1);
  });
  it('should not have leftover unprocessed content when processed after stream ended and should not re-process when called again', function () {
    var streamLogData = streamingLog(stream);

    var streamOfData = [
      {
        type: 'log',
        content: 'Step 1 : This is a step!\n',
        timestamp: moment().subtract(2,'hours').format()
      },
      {
        type: 'log',
        content: ' Actual message 1\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: ' Actual message 2\n',
        timestamp: moment().subtract(21,'hours').format()
      },
      {
        type: 'log',
        content: ' Actual message',
        timestamp: moment().subtract(21,'hours').format()
      }
    ];
    streamOfData.forEach(function (data) {
      stream.emit('data', data);
    });

    stream.emit('end');

    expect(streamLogData.logs[0].unprocessedContent.length).to.equal(3);
    var processed = streamLogData.logs[0].getProcessedHtml();
    expect(streamLogData.logs[0].unprocessedContent.length).to.equal(0);
    expect(streamLogData.logs[0].getProcessedHtml()).to.equal(processed);
  });
  it('should stop listening on destroy', function () {
    var streamLogData = streamingLog(stream);
    streamLogData.destroy();
    sinon.assert.calledOnce(stream.off);
  });
});