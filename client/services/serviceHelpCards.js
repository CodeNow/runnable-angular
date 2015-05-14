'use strict';
var EventEmitter = require('events').EventEmitter;

require('app')
  .factory('helpCards', helpCardsFactory);

function helpCardsFactory(
  $interpolate,
  keypather,
  fetchSettings,
  errs,
  promisify,
  $rootScope,
  jsonHash
) {

//POSSIBLE TARGETS:
//newContainer
//buildFiles
//buildCommand
//stackType
//exposedPorts
//repositories
//environmentVariables
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
          'environmentVariables': 'Add an association by setting an environment variable to your <b>{{association}}</b> container\'s elastic url.',
          'translationRules': 'Add an association by setting a translation rule for your <b>{{association}}</b> container\'s elastic url..'
        }
      },
      {
        id: 'missingDependency',
        'label': 'It looks like <b>{{instance.getDisplayName()}}</b> needs a <b>{{dependency}}</b> service and you don\'t have one.',
        'targets': [
          'newContainer'
        ],
        'helpTop': 'Add a new <b>{{dependency}}</b> service.',
        'helpPopover': {}
      }
    ]
  };

  var HelpCard = function (config) {
    var self = this;
    Object.keys(config).forEach(function (key) {
      self[key] = config[key];
    });

    var cardClone = {
      id: this.id,
      type: this.type
    };
    if (this.data && this.data.instance && this.data.instance.attrs) {
      cardClone.data = { instance: this.data.instance.attrs.shortHash };
    }

    if(this.data){
      Object.keys(this.data).forEach(function (key) {
        if (key !== 'instance'){
          cardClone.data[key] = self.data[key];
        }
      });
    }
    this.hash = jsonHash.digest(cardClone);
  };

  HelpCard.prototype = Object.create(EventEmitter.prototype);

  helpCards.general = helpCards.general.map(function (cardConfig) {
    cardConfig.type = 'general';
    var card = new HelpCard(cardConfig);
    var targetHash = {};
    card.targets.forEach(function (target) {
      targetHash[target] = true;
    });
    card.targets = targetHash;
    return card;
  });

  var triggeredHash = {};
  helpCards.triggered.forEach(function (cardConfig) {
    cardConfig.type = 'triggered';
    var card = new HelpCard(cardConfig);
    var targetHash = {};
    card.targets.forEach(function (target) {
      targetHash[target] = true;
    });
    card.targets = targetHash;
    triggeredHash[card.id] = card;
  });

  helpCards.triggered = triggeredHash;


  var currentCardHash = {};
  var activeCard = null;
  var helpCardManager = {
    cards: {
      general: helpCards.general,
      triggered: []
    },
    getActiveCard: function () {
      return activeCard;
    },
    setActiveCard: function (newCard) {
      if (activeCard && activeCard !== newCard) {
        activeCard.emit('deactivate');
      }

      if (newCard) {
        newCard.emit('activate');
        $rootScope.$broadcast('helpCardScroll:enable');
      } else {
        $rootScope.$broadcast('helpCardScroll:disable');
      }

      activeCard = newCard;
    },
    clearAllCards: function () {
      this.cards.triggered = [];
      activeCard = null;
    },
    refreshActiveCard: function () {
      if (this.getActiveCard()) {
        this.getActiveCard().emit('refresh');
        this.setActiveCard(null);
      }
    },
    refreshAllCards: function () {
      this.cards.triggered.forEach(function (card) {
        card.emit('refresh');
      });
      currentCardHash = {};
      this.cards.triggered = [];
      this.setActiveCard(null);
    },
    cardIsActiveOnThisContainer: function (container) {
      activeCard = this.getActiveCard();
      return activeCard && (activeCard.type === 'general' || angular.equals(container, keypather.get(activeCard, 'data.instance')));
    },
    refreshForInstance: function (instance) {
      this.cards.triggered
        .filter(function (card) {
          return keypather.get(card, 'data.instance.attrs.shortHash') === instance.attrs.shortHash;
        })
        .forEach(function (card) {
          card.emit('remove');
        });
    },
    triggerCard: function (cardId, data) {
      var self = this;
      return fetchSettings().then(function (settings) {
        var ignoredHelpCards = settings.attrs.ignoredHelpCards || [];

        var cardConfig = helpCards.triggered[cardId];
        if (!cardConfig) {
          throw new Error('Attempt to create a help card with invalid ID.');
        }
        cardConfig = angular.copy(cardConfig);


        cardConfig.label = $interpolate(cardConfig.label)(data);
        cardConfig.helpTop = $interpolate(cardConfig.helpTop)(data);
        Object.keys(cardConfig.helpPopover).forEach(function (key) {
          cardConfig.helpPopover[key] = $interpolate(cardConfig.helpPopover[key])(data);
        });

        cardConfig.data = data;

        var helpCard = new HelpCard(cardConfig);

        if (!currentCardHash[helpCard.hash] && ignoredHelpCards.indexOf(helpCard.hash) === -1) {
          self.cards.triggered.push(helpCard);
          currentCardHash[helpCard.hash] = helpCard;
          helpCard.on('remove', function () {
            if (self.getActiveCard() === helpCard) {
              self.setActiveCard(null);
            }
            var index = self.cards.triggered.indexOf(helpCard);
            self.cards.triggered.splice(index, 1);
          });
          helpCard.on('refresh', function () {
            helpCard.emit('remove');
          });
        }
        return currentCardHash[helpCard.hash];
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
        ignoredHelpCards.push(card.hash);

        return promisify(settings, 'update')({
          json: {
            ignoredHelpCards: ignoredHelpCards
          }
        });
      })
        .catch(errs.handler);
    }
  };
  return helpCardManager;
}