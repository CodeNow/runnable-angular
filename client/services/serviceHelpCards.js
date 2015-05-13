'use strict';
var jsonHash = require('json-hash');

require('app')
  .factory('helpCards', helpCardsFactory);

var helpCards = {
  'general': [
    {
      'label': 'Change language or framework',
      'targets': ['stackType'],
      'helpTop': 'Use the <b>stack type</b> tool to change the language or framework.',
      'helpPopover': {
        'stackType': 'Use the <b>stack type</b> tool to change the language or framework.'
      }
    },
    {
      'label': 'Connect to an external service',
      'targets': ['environmentVariables'],
      'helpTop': 'Add the external service in an <b>environment variable</b>.',
      'helpPopover': {
        'environmentVariables': 'Add your external service here so you can reference it in your code.'
      }
    }
  ],
  'triggered': [
    {
      id: 'missingAssociation',
      'label': 'It looks like <b>{{instance.getDisplayName()}}</b> should be associated with <b>{{association}}</b>',
      'targets': [
        'environmentVariables',
        'translationRules'
      ],
      'helpTop': 'Use <b>Translation Rules</b> or <b>Environment Variables</b> to create an association for <b>{{instance.getDisplayName()}}</b>.',
      'helpPopover': {
        'environmentVariables': 'You can add an association by setting an environment variable pointing to your <b>{{association}}</b> container.',
        'translationRules': 'You can add an association by setting a translation rule for your <b>{{association}}</b> container.'
      }
    },
    {
      id: 'missingDependency',
      'label': 'It looks like <b>{{instance.getDisplayName()}}</b> needs a <b>{{dependency}}</b> service and you don\'t have one configured.',
      'targets': [
        'newContainer'
      ],
      'helpTop': 'Add a new <b>{{dependency}}</b> service.',
      'helpPopover': {}
    }
  ]
};

helpCards.general.forEach(function (card) {
  card.type = 'general';
  var targetHash = {};
  card.targets.forEach(function (target) {
    targetHash[target] = true;
  });
  card.targets = targetHash;
});

var triggeredHash = {};
helpCards.triggered.forEach(function (card) {
  card.type = 'triggered';
  var targetHash = {};
  card.targets.forEach(function (target) {
    targetHash[target] = true;
  });
  card.targets = targetHash;
  triggeredHash[card.id] = card;
});

helpCards.triggered = triggeredHash;

//POSSIBLE TARGETS:
//newContainer
//buildFiles
//buildCommand
//stackType
//exposedPorts
//repositories
//environmentVariables

function helpCardsFactory(
  $interpolate,
  keypather,
  fetchSettings,
  errs,
  promisify,
  $q
) {
  function getCardHash(card) {
    var cardClone = {
      data: {
        instance: keypather.get(card, 'data.instance.id')
      },
      id: card.id,
      type: card.type
    };
    var data = card.data;
    if(data){
      Object.keys(data).forEach(function (key) {
        if (key !== 'instance'){
          cardClone.data[key] = card.data[key];
        }
      });
    }
    return jsonHash.digest(cardClone);
  }
  var cards = {
    general: helpCards.general,
    triggered: []
  };
  var currentCardHash = {};
  var activeCard = null;
  return {
    cards: cards,
    getActiveCard: function () {
      return activeCard;
    },
    setActiveCard: function (newCard) {
      activeCard = newCard;
    },
    refreshActiveCard: function () {
      if (this.getActiveCard()) {
        currentCardHash[getCardHash(this.getActiveCard())].resolve();
        this.setActiveCard(null);
      }
    },
    refreshAllCards: function () {
      this.cards.triggered.forEach(function (card) {
        currentCardHash[getCardHash(card)].resolve();
      });
      currentCardHash = {};
      this.cards.triggered = [];
      this.setActiveCard(null);
    },
    cardIsActiveOnThisContainer: function (container) {
      activeCard = this.getActiveCard();
      return activeCard && (activeCard.type === 'general' || angular.equals(container, keypather.get(activeCard, 'data.instance')));
    },
    triggerCard: function (cardId, data) {
      return fetchSettings().then(function (settings) {
        var ignoredHelpCards = settings.attrs.ignoredHelpCards || [];

        var helpCard = helpCards.triggered[cardId];
        if (!helpCard) {
          return;
        }
        helpCard = angular.copy(helpCard);
        helpCard.label = $interpolate(helpCard.label)(data);
        helpCard.helpTop = $interpolate(helpCard.helpTop)(data);
        Object.keys(helpCard.helpPopover).forEach(function (key) {
          helpCard.helpPopover[key] = $interpolate(helpCard.helpPopover[key])(data);
        });

        helpCard.data = data;

        var cardHash = getCardHash(helpCard);
        if (!currentCardHash[cardHash] && ignoredHelpCards.indexOf(cardHash) === -1) {
          cards.triggered.push(helpCard);
          currentCardHash[cardHash] = $q.defer();
        }
        return currentCardHash[cardHash].promise;
      })
        .catch(errs.handler);
    },
    ignoreCard: function (card) {
      var index = this.cards.triggered.indexOf(card);
      this.cards.triggered.splice(index, 1);
      if (this.getActiveCard() === card) {
        this.setActiveCard(null);
      }
      fetchSettings().then(function (settings) {
        var ignoredHelpCards = settings.attrs.ignoredHelpCards || [];
        ignoredHelpCards.push(getCardHash(card));

        return promisify(settings, 'update')({
          json: {
            ignoredHelpCards: ignoredHelpCards
          }
        });
      })
        .catch(errs.handler);
    }
  };
}