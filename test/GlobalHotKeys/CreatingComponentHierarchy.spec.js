import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';

import {GlobalHotKeys} from '../../src';
import KeyEventManager from '../../src/lib/KeyEventManager';

describe('Creating component hierarchy for GlobalHotKeys:', () => {
  beforeEach(function () {
    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  context('when a GlobalHotKeys component is nested in another', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <div className="innerChildElement">
            <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1} />
          </div>
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
        0: {
          parentId: null,
          childIds: [1]
        },
        1: {
          parentId: 0,
          childIds: []
        }
      });
    });
  });

  context('when there are several levels of GlobalHotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1}>
            <div className="innerChildElement" />

            <GlobalHotKeys keyMap={{GRAND_CHILD: 'a'}} id={2}/>
          </GlobalHotKeys>
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
        0: {
          parentId: null,
          childIds: [1]
        },
        1: {
          parentId: 0,
          childIds: [2]
        },
        2: {
          parentId: 1,
          childIds: []
        }
      });
    });
  });

  context('when there sibling GlobalHotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <GlobalHotKeys keyMap={{CHILD1: 'a'}} id={1}/>
          <GlobalHotKeys keyMap={{CHILD1: 'a'}} id={2}/>
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
        0: {
          parentId: null,
          childIds: [1, 2]
        },
        1: {
          parentId: 0,
          childIds: []
        },
        2: {
          parentId: 0,
          childIds: []
        }
      });
    });
  });

  context('when there is complex nesting of GlobalHotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <GlobalHotKeys keyMap={{CHILD1: 'a'}} id={1}>
            <GlobalHotKeys keyMap={{GRAND_CHILD1: 'a'}} id={2}>
              <GlobalHotKeys keyMap={{GREAT_GRAND_CHILD1: 'a'}} id={3}/>
            </GlobalHotKeys>
          </GlobalHotKeys>

          <GlobalHotKeys keyMap={{CHILD2: 'a'}} id={4}>
            <GlobalHotKeys keyMap={{GRAND_CHILD2: 'a'}} id={5}/>
          </GlobalHotKeys>

          <GlobalHotKeys keyMap={{CHILD3: 'a'}} id={6} />
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
        0: {
          parentId: null,
          childIds: [1, 4, 6]
        },
        1: {
          parentId: 0,
          childIds: [2]
        },
        2: {
          parentId: 1,
          childIds: [3]
        },
        3: {
          parentId: 2,
          childIds: []
        },
        4: {
          parentId: 0,
          childIds: [5]
        },
        5: {
          parentId: 4,
          childIds: []
        },
        6: {
          parentId: 0,
          childIds: []
        },
      });
    });
  });

  context('when a GlobalHotKeys components are unmounted and mounted', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div>
            <div className="outerChildElement" />

            <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
              <div className="innerChildElement" />

              <GlobalHotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} key={2}/>
            </GlobalHotKeys>
          </div>
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    context('when all of the children are changed for new components', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1} nextId={3} >
                <div className="innerChildElement" />

                <GlobalHotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} nextId={4} />
              </GlobalHotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
          0: {
            parentId: null,
            childIds: [3]
          },
          3: {
            parentId: 0,
            childIds: [4]
          },
          4: {
            parentId: 3,
            childIds: []
          }
        });
      })
    });

    context('when some of the children are changed for new components', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
                <div className="innerChildElement" />

                <GlobalHotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} key={3}/>
              </GlobalHotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
          0: {
            parentId: null,
            childIds: [1]
          },
          1: {
            parentId: 0,
            childIds: [3]
          },
          3: {
            parentId: 1,
            childIds: []
          }
        });
      })
    });

    context('when some of the children are removed', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <GlobalHotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
                <div className="innerChildElement" />
              </GlobalHotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._globalEventStrategy.componentRegistry).to.eql({
          0: {
            parentId: null,
            childIds: [1]
          },
          1: {
            parentId: 0,
            childIds: []
          }
        });
      })
    });
  });
});
