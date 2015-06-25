'use strict';
var EventEmitter = require('events').EventEmitter;

require('app')
  .factory('helpCards', helpCardsFactory);

function helpCardsFactory(
  $interpolate,
  $q,
  keypather,
  fetchSettings,
  errs,
  promisify,
  $rootScope,
  jsonHash
) {

//POSSIBLE TARGETS:
//newContainer
//containerFiles
//buildCommand
//stackType
//exposedPorts
//repositories
//findAndReplace
//environmentVariables
  var helpCards = {
    'general': [
      {
        'label': 'Change language or framework',
        'targets': ['stackType'],
        'helpTop': 'Use the <b>Repository</b> tool to change the language or framework.',
        'helpPopover': {
          'stackType': 'Change the language, framework or versions below.'
        }
      },
      {
        'label': 'Connect to an external service',
        'targets': [
          'environmentVariables',
          'findAndReplace'
        ],
        'helpTop': 'Configure your external service by using an <b>Environment Variable</b> or the <b>Find and Replace</b> tool.',
        'helpPopover': {
          'environmentVariables': 'Reference your external service here by adding or modifying an <b>environment variable</b>.',
          'findAndReplace': 'Reference your external service here by creating a <b>new rule</b>.'
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
          'repositories': 'Use <b>Build Commands</b> to install a library. Example: apt-get install -y git',
          'containerFiles': 'Use <b>Build Commands</b> to install a library. Example: apt-get install -y git'
        }
      },
      {
        'label': 'Configure an OAuth service',
        'targets': [
          'environmentVariables',
          'findAndReplace'
        ],
        'helpTop': 'Update your OAuth credentials using the <b>Environment Variables</b> or <b>Find and Replace</b> tool.',
        'helpPopover': {
          'environmentVariables': 'Update the environment variables that you use to specify OAuth credentials.',
          'findAndReplace': 'Add a rule to update your OAuth credentials in your code.'
        }
      },
      {
        'label': 'Seed a database',
        'targets': ['containerFiles'],
        'helpTop': 'Use <b>Container Files</b> to upload seed data and run commands to import it.',
        'helpPopover': {
          'containerFiles': 'Click <b>Upload File</b> to select and upload seed data. Specify <b>Build Commands</b> to run shell commands after import.'
        }
      }
    ],
    'triggered': [
      {
        id: 'missingAssociation',
        'label': '<b>{{instance.getDisplayName()}}</b> may need to be updated with <b>{{association}}\’s</b> hostname.</b>',
        'targets': [
          'environmentVariables',
          'findAndReplace'
        ],
        'helpTop': 'Update <b>{{instance.getDisplayName()}}\’s</b> code by using <b>Find and Replace</b> or <b>Environment Variables</b> to update the hostname for <b>{{association}}</b>.',
        'helpPopover': {
          'environmentVariables': 'Add/update the correct environment variable with <b>{{association}}\’s</b> elastic hostname.',
          'findAndReplace': 'Add a string rule to modify your code to connect with <b>{{association}}\’s</b> elastic hostname.'
        }
      },
      {
        id: 'missingDependency',
        'label': '<b>{{instance.getDisplayName()}}</b> may need a <b>{{dependency}}</b> container.',
        'targets': [
          'newContainer'
        ],
        'helpTop': 'Click on the <b>New Container</b> button to add a <b>{{dependency}}</b> container.',
        'helpPopover': {
          'newContainer': 'Click <b>Non-repository</b> to add a <b>{{dependency}}</b> container.'
        }
      },
      {
        id: 'missingMapping',
        label: 'You may need to add a mapping to <b>{{mapping}}\’s</b> elastic hostname for some repository containers.',
        targets: [
          'environmentVariables',
          'findAndReplace'
        ],
        helpTop: 'Connect one of more of your repository containers to <b>{{mapping}}\’s</b> elastic hostname by using <b>Environment Variables</b>.',
        helpPopover: {
          environmentVariables: 'Add/update the correct environment variable with <b>{{mapping}}\’s</b> elastic hostname.',
          findAndReplace: 'Add a string rule to modify your code to connect with <b>{{mapping}}\’s</b> elastic hostname.'
        },
        highlightRepoContainers: true
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
      type: this.type,
      data: {}
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
      if (!keypather.get($rootScope, 'featureFlags.' + target)) {
        targetHash[target] = true;
      }
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
      if (!keypather.get($rootScope, 'featureFlags.' + target)) {
        targetHash[target] = true;
      }
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
      currentCardHash = {};
      activeCard = null;
    },
    hideActiveCard: function () {
      if (this.getActiveCard()) {
        var helpCard = this.getActiveCard();
        currentCardHash[helpCard.hash] = null;
        this.setActiveCard(null);
        var index = this.cards.triggered.indexOf(helpCard);
        this.cards.triggered.splice(index, 1);
      }
    },
    refreshActiveCard: function () {
      if (this.getActiveCard()) {
        this.getActiveCard().emit('refresh');
        this.setActiveCard(null);
      }
    },
    refreshAllCards: function () {
      this.cards.triggered.forEach(function (card) {
        if (!card.removed) {
          card.emit('refresh');
        }
      });
      currentCardHash = {};
      this.cards.triggered = [];
      this.setActiveCard(null);
    },
    cardIsActiveOnThisContainer: function (container) {
      activeCard = this.getActiveCard();

      return activeCard &&
        (
          activeCard.type === 'general' ||
          angular.equals(container, keypather.get(activeCard, 'data.instance')) ||
          ( activeCard.highlightRepoContainers && container.contextVersion.getMainAppCodeVersion() )
        );
    },
    removeByInstance: function (instance) {
      this.cards.triggered
        .filter(function (card) {
          return keypather.get(card, 'data.instance.attrs.shortHash') === instance.attrs.shortHash;
        })
        .forEach(function (card) {
          if (!card.removed) {
            card.emit('remove');
          }
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
          self.cards.triggered.unshift(helpCard);
          currentCardHash[helpCard.hash] = helpCard;
          helpCard.on('remove', function () {
            if (self.getActiveCard() === helpCard) {
              self.setActiveCard(null);
            }
            helpCard.removed = true;
            var index = self.cards.triggered.indexOf(helpCard);
            self.cards.triggered.splice(index, 1);
            currentCardHash[helpCard.hash] = null;
          });
          helpCard.on('refresh', function () {
            if (!helpCard.removed) {
              helpCard.emit('remove');
            }
          });
        }
        return $q.when(currentCardHash[helpCard.hash]);
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
