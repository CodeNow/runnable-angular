'use strict';
var jsonHash = require('json-hash');
var EventEmitter = require('events').EventEmitter;

require('app')
  .factory('helpCards', helpCardsFactory);

var helpCards = {
  'general': [
    {
      'label': 'Change language or framework',
      'targets': ['stackType'],
      'helpTop': 'Use the stack type button to change the language or framework.',
      'helpPopover': {
        'stackType': 'Use the stack type button to change the language or framework.'
      }
    },
    {
      'label': 'Connect to an external service',
      'targets': ['environmentVariables'],
      'helpTop': 'Add the external service in an environment variable.',
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
      'helpTop': 'Use Translation Rules or Environment Variables to create an association for {{instance.getDisplayName()}}.',
      'helpPopover': {
        'environmentVariables': 'You can add an association by setting an environment variable pointing to your {{association}} container.',
        'translationRules': 'You can add an association by setting a translation rule for your {{association}} container.'
      }
    },
    {
      id: 'missingDependency',
      'label': 'It looks like {{instance.getDisplayName()}} needs a {{dependency}} service and you don\'t have one configured.',
      'targets': [
        'newContainer'
      ],
      'helpTop': 'Add a new {{dependency}} service.',
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
      if (activeCard && activeCard !== newCard) {
        var currentEvented = currentCardHash[getCardHash(activeCard)];
        if (currentEvented) {
          currentEvented.emit('deactivate');
        }
      }

      if (newCard) {
        var newEvented = currentCardHash[getCardHash(newCard)];
        if (newEvented) {
          newEvented.emit('activate');
        }
      }

      activeCard = newCard;
    },
    refreshActiveCard: function () {
      if (this.getActiveCard()) {
        currentCardHash[getCardHash(this.getActiveCard())].emit('refresh');
        this.setActiveCard(null);
      }
    },
    refreshAllCards: function () {
      this.cards.triggered.forEach(function (card) {
        currentCardHash[getCardHash(card)].emit('refresh');
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
          throw new Error('Attempt to create a help card with invalid ID.');
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
          currentCardHash[cardHash] = new EventEmitter();
        }
        return currentCardHash[cardHash];
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