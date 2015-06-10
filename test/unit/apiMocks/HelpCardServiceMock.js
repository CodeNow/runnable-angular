"use strict";

var EventEmitter = require('events').EventEmitter;
var HelpCard = function () {};
HelpCard.prototype = Object.create(EventEmitter.prototype);

module.exports = {
  create: function (ctx) {
    return function ($q) {
      var helpCards = {
        getActiveCard: sinon.stub(),
        setActiveCard: sinon.stub(),
        clearAllCards: sinon.stub(),
        hideActiveCard: sinon.stub(),
        refreshActiveCard: sinon.stub(),
        refreshAllCards: sinon.stub(),
        cardIsActiveOnThisContainer: sinon.stub(),
        triggerCard: sinon.stub().returns($q.when(new HelpCard())),
        ignoreCard: sinon.stub(),
        removeByInstance: sinon.stub()
      };
      if (ctx) {
        ctx.helpCards = helpCards;
      }
      return helpCards;
    };
  }
};
