import {expect} from 'chai';
import simulant from 'simulant';
import KeyEventManager from '../../../src/lib/KeyEventManager';
import KeyEventState from '../../../src/const/KeyEventState';

describe('Correctly creating key history for GlobalKeyEventStrategy:', function () {
  beforeEach(function () {
    this.keyEventManager = new KeyEventManager();

    this.eventStrategy = this.keyEventManager.globalEventStrategy;
  });

  context('when shift and a are pressed together', () => {
    context('and shift is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Shift'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "Shift": [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            "ids": [
              "Shift"
            ],
            "keyAliases": {}
          }
        ]);
      });

      context('and released last', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "A": [
                  [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "A": [
                  [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "A": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);
        });
      });
    });

    context('and a is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'a'}));
        this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'a'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "a": [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
              ]
            },
            "ids": [
              "a"
            ],
            "keyAliases": {}
          }
        ]);
      });

      context('and released last', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Shift+A",
                "Shift+a"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);
        });
      });
    });
  });

  context('when Alt and a are pressed together', () => {
    context('and Alt is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Alt'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "Alt": [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
              ]
            },
            "ids": [
              "Alt"
            ],
            "keyAliases": {}
          }
        ]);
      });

      context('and released last', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "å": [
                  [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "å": [
                  [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "å": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);
        });
      });
    });

    context('and a is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'a'}));
        this.eventStrategy.handleKeyPress(simulant('keypress', {key: 'a'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "a": [
                [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
              ]
            },
            "ids": [
              "a"
            ],
            "keyAliases": {}
          }
        ]);
      });

      context('and released last', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeyDown(simulant('keydown', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyUp(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                "a": [
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);
        });
      });
    });
  });
});
