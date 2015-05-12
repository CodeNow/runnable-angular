'use strict';
var jsonHash = require('json-hash');

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
      id: 'association',
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
  $localStorage
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
    var hash = jsonHash.digest(cardClone);
    console.log(hash);
    return hash;
  }
  var cards = {
    general: helpCards.general,
    triggered: []
  };
  return {
    cards: cards,
    activeCard: null,
    cardIsActiveOnThisContainer: function (container) {
      return this.activeCard && (this.activeCard.type === 'general' || angular.equals(container, keypather.get(this, 'activeCard.data.instance')));
    },
    triggerCard: function (cardId, data) {
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

      if(!keypather.get($localStorage, 'helpCards.'+getCardHash(helpCard))){
        cards.triggered.push(helpCard);
      }
    },
    ignoreCard: function (card) {
      var index = this.cards.triggered.indexOf(card);
      this.cards.triggered.splice(index, 1);
      if (this.activeCard === card) {
        this.activeCard = null;
      }
      keypather.set($localStorage, 'helpCards.'+getCardHash(card), true);
    }
  };
}