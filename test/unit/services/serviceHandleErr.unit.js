describe('serviceHandleErr', function () {
  var errs;
  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function(_$rootScope_, _errs_) {
      $rootScope = _$rootScope_;
      errs = _errs_;

      $rootScope.safeApply = sinon.spy();
    });
  });

  it('pushes an error when given one', function() {
    var err = 'Big, fat error';
    errs.handler(err);
    expect(errs.errors).to.deep.equal([err]);
    sinon.assert.called($rootScope.safeApply);
  });

  it('does not push an error that we should skip', function() {
    var err = {
      data: {
        statusCode: 401
      }
    };
    errs.handler(err);
    expect(errs.errors).to.deep.equal([]);
    sinon.assert.notCalled($rootScope.safeApply);
  });

  it('does nothing with no err', function() {
    errs.handler();
    expect(errs.errors).to.deep.equal([]);
    sinon.assert.notCalled($rootScope.safeApply);
  });
});