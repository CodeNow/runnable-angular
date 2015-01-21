'use strict';

describe('serviceCreateInstanceDeployedPoller'.bold.underline.blue, function() {
  var createInstanceDeployedPoller,
      interval,
      intervalCallback;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.module(function($provide){
      interval = sinon.spy(function(cb) {
        intervalCallback = cb;
        cb();
        return true;
      });
      interval.cancel = sinon.spy();
      $provide.value('$interval', interval);;
    });
    angular.mock.inject(function(_createInstanceDeployedPoller_) {
      createInstanceDeployedPoller = _createInstanceDeployedPoller_;
    });
  });

  it('returns a singleton of InstanceDeployedPoller per instance.id()', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      }
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    var i2 = createInstanceDeployedPoller(mockInstance);
    expect(i1).to.equal(i2);
  });

  it('No more than one $interval created given one or more invokations of start()', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      build: {
        failed: function(){ return false; },
        succeeded: function(){ return false; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, false);
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    expect(i1.pollingStarted).to.equal(false);
    expect(i1.startCounter).to.equal(0);
    i1.start();

    sinon.assert.calledOnce(mockInstance.deployed);
    expect(i1.pollingStarted).to.equal(true);
    expect(i1.startCounter).to.equal(1);
    sinon.assert.calledOnce(interval);
    i1.start();

    sinon.assert.calledOnce(mockInstance.deployed);
    expect(i1.pollingStarted).to.equal(true);
    expect(i1.startCounter).to.equal(2);
    sinon.assert.calledOnce(interval);
  });

  it('clear only stops interval when startCounter reduced to 0', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      build: {
        failed: function(){ return false; },
        succeeded: function(){ return false; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, false);
      }),
      fetch: sinon.spy(function(cb){
        cb();
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    i1.start();
    i1.start();
    expect(i1.startCounter).to.equal(2);
    i1.clear();
    expect(i1.startCounter).to.equal(1);
    sinon.assert.notCalled(interval.cancel);
    i1.clear();
    expect(i1.startCounter).to.equal(0);
    sinon.assert.calledOnce(interval.cancel);
    sinon.assert.calledOnce(mockInstance.fetch);
  });

  it('should not poll if instance.build is failed', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      build: {
        failed: function(){ return true; },
        succeeded: function(){ return false; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, false);
      }),
      fetch: sinon.spy(function(cb){
        cb();
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    i1.start();
    expect(i1.startCounter).to.equal(0);
    expect(i1.pollingStarted).to.equal(false);
    sinon.assert.notCalled(interval);
  });

  it('should not poll if instance.build is succeeded & has containers', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      containers: {
        models: [true]
      },
      build: {
        failed: function(){ return false; },
        succeeded: function(){ return true; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, false);
      }),
      fetch: sinon.spy(function(cb){
        cb();
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    i1.start();
    expect(i1.startCounter).to.equal(0);
    expect(i1.pollingStarted).to.equal(false);
    sinon.assert.notCalled(interval);
  });

  it('should not poll more than 100 times', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      build: {
        failed: function(){ return false; },
        succeeded: function(){ return false; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, false);
      }),
      fetch: sinon.spy(function(cb){
        cb();
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    i1.start();
    expect(i1.startCounter).to.equal(1);
    expect(i1.pollingStarted).to.equal(true);
    for(var i=0; i < 102; i++) { // 101 iterations
      intervalCallback();
    }
    sinon.assert.called(interval);
  });

  it('should clear if instance deployed returns true', function(){
    var mockInstance = {
      id: function () {
        return '12345';
      },
      build: {
        failed: function(){ return false; },
        succeeded: function(){ return false; }
      },
      deployed: sinon.spy(function(cb){
        cb(null, true);
      }),
      fetch: sinon.spy(function(cb){
        cb();
      })
    };
    var i1 = createInstanceDeployedPoller(mockInstance);
    i1.clear = sinon.spy();
    i1.start();
    sinon.assert.calledOnce(i1.clear);
  });

});
