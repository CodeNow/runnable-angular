'use strict';

var configTerminalOpts = {
  cols: 80,
  rows: 20,
  useStyle: true,
  screenKeys: true,
  scrollback: 1000,
  wraparoundMode: false,
  hideCursor: true,
  cursorBlink: false
};
Object.freeze(configTerminalOpts);
require('app')
  .value('configTerminalOpts', configTerminalOpts);
