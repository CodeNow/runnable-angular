'use strict';

var helpCards = {
  'general': [
    {
      'label': 'Change language or framework',
      'targets': ['stackType'],
      'helpTop': 'Use the stack type button to change the language or framework.',
      'helpPopover': {
        'stackType': 'Use the stack type button to change the language or framework.'
      }
    }
  ],
  'triggered': [
    {
      id: 'association',
      'label': 'It looks like {{instance.getDisplayName()}} should be associated with {{association}}',
      'targets': [
        'environmentVariables',
        'translationRules'
      ],
      'helpTop': 'Use Translation Rules or Environment Variables to create an association for {{instance.getDisplayName()}}.',
      'helpPopover': {
        'environmentVariables': 'You can add an association by setting an environment variable pointing to your {{association}} container.',
        'translationRules': 'You can add an association by setting a translation rule for your {{association}} container.'
      }
    }
  ]
};

helpCards.general.forEach(function (card) {
  card.type = 'general';
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

module.exports = helpCards;


//buildFiles
//buildCommand
//stackType
//exposedPorts
//repositories
//environmentVariables