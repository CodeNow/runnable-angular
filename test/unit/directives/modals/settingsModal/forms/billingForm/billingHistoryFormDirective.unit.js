/*global directiveTemplate:true */
'use strict';
var $scope;
var $elScope;
var $q;

describe('billingHistoryFormDirective'.bold.underline.blue, function () {
  var fetchInvoicesStub;
  var loadingStub;
  var mockInvoices;
  beforeEach(function () {
    mockInvoices = [
      {
        id: 'invoice1',
        total: 20
      },
      {
        id: 'invoice2',
        total: 0
      }
    ];
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchInvoices', function ($q) {
        fetchInvoicesStub = sinon.stub().returns($q.when(mockInvoices));
        return fetchInvoicesStub;
      });
      loadingStub = sinon.stub();
      $provide.value('loading', loadingStub);
    });
    angular.mock.inject(function (
      $compile,
      $rootScope,
      _$q_
    ) {
      $q = _$q_;
      $scope = $rootScope.$new();
      $scope.save = sinon.stub();
      var tpl = directiveTemplate.attribute('billing-history-form');
      var element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });

  it('should load invoices and set loading state along the way', function () {
    sinon.assert.calledTwice(loadingStub);
    sinon.assert.calledWith(loadingStub, 'billingForm', true);
    sinon.assert.calledWith(loadingStub, 'billingForm', false);
    sinon.assert.calledOnce(fetchInvoicesStub);
    expect($scope.invoices).to.equal(mockInvoices);
  });

  describe('getBillingDate', function () {
    var now = new Date('Mon Aug 22 2016 9:14:37 GMT-0700 (PDT)');
    it('calculate the billing date properly', function () {
      var results = $scope.getBillingDate({
        periodEnd: now.toUTCString()
      });
      expect(results).to.equal('Aug 22nd, 2016');
    });
  });
});
