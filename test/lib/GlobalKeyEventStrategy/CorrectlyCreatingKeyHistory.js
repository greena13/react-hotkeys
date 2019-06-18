import {expect} from 'chai';
import simulant from 'simulant';
import KeyEventManager from '../../../src/lib/KeyEventManager';
import KeyEventRecordState from '../../../src/const/KeyEventRecordState';

describe('Correctly creating key history for GlobalKeyEventStrategy:', function () {
  beforeEach(function () {
    this.keyEventManager = new KeyEventManager();

    this.eventStrategy = this.keyEventManager._globalEventStrategy;
  });

  context('when shift and a are pressed together', () => {
    context('and shift is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Shift'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "Shift": [
                [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
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
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "A": [
                  [KeyEventRecordState.unseen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeypress(simulant('keypress', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "A": [
                  [KeyEventRecordState.unseen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeypress(simulant('keypress', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "A+Shift",
                "Shift+a"
              ],
              "keyAliases": { 'a': 'A' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "A": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "A+Shift",
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
        this.eventStrategy.handleKeydown(simulant('keydown', {key: 'a'}));
        this.eventStrategy.handleKeypress(simulant('keypress', {key: 'a'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "a": [
                [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
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
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'A'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
              ],
              "keyAliases": { 'A': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Shift'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Shift": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Shift+a",
                "A+Shift"
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
        this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Alt'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "Alt": [
                [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
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
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "å": [
                  [KeyEventRecordState.unseen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeypress(simulant('keypress', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
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
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "å": [
                  [KeyEventRecordState.unseen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeypress(simulant('keypress', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+å",
                "Alt+a"
              ],
              "keyAliases": { 'a': 'å' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "å": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
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
        this.eventStrategy.handleKeydown(simulant('keydown', {key: 'a'}));
        this.eventStrategy.handleKeypress(simulant('keypress', {key: 'a'}));

        expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
          {
            "keys": {
              "a": [
                [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
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
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'a'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);
        });
      });

      context('and released first', () => {
        it('then correctly updates combination history', function() {
          this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'å'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);

          this.eventStrategy.handleKeyup(simulant('keyup', {key: 'Alt'}));

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              "keys": {
                "Alt": [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                "a": [
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                ]
              },
              "ids": [
                "Alt+a",
                "Alt+å"
              ],
              "keyAliases": { 'å': 'a' }
            }
          ]);
        });
      });
    });
  });
});
