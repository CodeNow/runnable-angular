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
        'helpTop': 'Use the <b>Stack Type</b> tool to change the language or framework.',
        'helpPopover': {
          'stackType': 'Change the language, framework or versions below.'
        }
      },
      {
        'label': 'Connect to an external service',
        'targets': [
          'environmentVariables',
          'translationRules'
        ],
        'helpTop': 'Configure your external service by using an <b>Environment Variable</b> or <b>Translation Rule</b>.',
        'helpPopover': {
          'environmentVariables': 'Reference your external service here by adding or modifying an <b>environment variable</b>.',
          'translationRules': 'Reference your external service here by creating a <b>new rule</b>.'
        }
      },
      {
        'label': 'Add a library',
        'targets': [
          'repositories',
          'containerFiles'
        ],
        'helpTop': 'Add <b>Build Commands</b> to install libraries from the <b>Repositories</b> or <b>Container Files</b> tool.',
        'helpPopover': {
          'repositories': 'Add a <b>Build Command</b> to install a library. Example: apt-get install -y git',
          'containerFiles': 'Add a <b>Build Command</b> to install a library. Example: apt-get install -y git'
        }
      },
      {
        'label': 'Configure an OAuth service',
        'targets': [
          'environmentVariables',
          'translationRules'
        ],
        'helpTop': 'Update your OAuth credentials using the <b>Environment Variables</b> or <b>Translation Rules</b> tool.',
        'helpPopover': {
          'environmentVariables': 'Update the environment variables that you use to specify OAuth credentials.',
          'translationRules': 'Add a translation rule to update your OAuth credentials in your code.'
        }
      }
      //{
      //  'label': 'Seed a database',
      //  'targets': ['containerFiles'],
      //  'helpTop': 'Use <b>Container Files</b> to upload seed data and specify <b>Build Commands</b> to run scripts.',
      //  'helpPopover': {
      //    'containerFiles': 'Upload seed data files and input shell commands to import the data using <b>Build Commands</b>.'
      //  }
      //}
    ],
    'triggered': [
      {
        id: 'missingAssociation',
        'label': '<b>{{instance.getDisplayName()}}</b> may need to be updated with <b>{{association}}\'s</b> hostname.</b>',
        'targets': [
          'environmentVariables',
          'translationRules'
        ],
        'helpTop': 'Update <b>{{instance.getDisplayName()}}\'s</b> code by using <b>Translation Rules</b> or <b>Environment Variables</b> to update the hostname for <b>{{association}}</b>.',
        'helpPopover': {
          'environmentVariables': 'Add/update the correct environment variable with <b>{{association}}\'s</b> elastic hostname.',
          'translationRules': 'Add a translation rule to modify your code to connect with <b>{{association}}\'s</b> elastic hostname.'
        }
      },
      {
        id: 'missingDependency',
        'label': '<b>{{instance.getDisplayName()}}</b> may need a <b>{{dependency}}</b> container.',
        'targets': [
          'newContainer'
        ],
        'helpTop': 'Click on <b>New Container</b> to add a <b>{{dependency}}</b> service.',
        'helpPopover': {
          'newContainer': 'Click on <b>Non-repository</b> to add a <b>{{dependency}}</b> service.'
        }
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

    if (this.data) {
      Object.keys(this.data).forEach(function (key) {
        if (key !== 'instance') {
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
    removeByInstance: function (instance) {
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
