import {expect} from 'chai';
import simulant from 'simulant';
import KeyEventManager from '../../src/lib/KeyEventManager';

describe('GlobalKeyEventStrategy:', function () {
  beforeEach(function () {
    this.keyEventManager = new KeyEventManager();

    this.eventStrategy = this.keyEventManager._globalEventStrategy;
  });

  context('when shift and a are pressed together', () => {
    context('and shift is pressed first', () => {
      beforeEach(function () {
        this.eventStrategy.handleKeydown(simulant('keydown', {key: 'Shift'}));

        expect(this.eventStrategy.keyCombinationHistory).to.eql([
          {
            "keys": {
              "Shift": [
                [true, false, false],
                [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "A": [
                  [false, false, false],
                  [true, false, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "A": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "A": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "A": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "A": [
                  [false, false, false],
                  [true, false, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "A": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "A": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "A": [
                  [true, true, false],
                  [true, true, true]
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

        expect(this.eventStrategy.keyCombinationHistory).to.eql([
          {
            "keys": {
              "a": [
                [true, false, false],
                [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Shift": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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

        expect(this.eventStrategy.keyCombinationHistory).to.eql([
          {
            "keys": {
              "Alt": [
                [true, false, false],
                [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "å": [
                  [false, false, false],
                  [true, false, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "å": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "å": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "å": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "å": [
                  [false, false, false],
                  [true, false, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "å": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "å": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "å": [
                  [true, true, false],
                  [true, true, true]
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

        expect(this.eventStrategy.keyCombinationHistory).to.eql([
          {
            "keys": {
              "a": [
                [true, false, false],
                [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, false, false],
                  [true, true, false]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, false, false],
                  [true, true, false]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              "keys": {
                "Alt": [
                  [true, true, false],
                  [true, true, true]
                ],
                "a": [
                  [true, true, false],
                  [true, true, true]
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
