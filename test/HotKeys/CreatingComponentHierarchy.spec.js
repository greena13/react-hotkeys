import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';

import {HotKeys} from '../../src';
import KeyEventManager from '../../src/lib/KeyEventManager';

describe('Creating component hierarchy for HotKeys:', () => {
  beforeEach(function () {
    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  context('when a HotKeys component is nested in another', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <div className="innerChildElement">
            <HotKeys keyMap={{CHILD: 'a'}} id={1} />
          </div>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

  context('when there are several levels of HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <HotKeys keyMap={{CHILD: 'a'}} id={1}>
            <div className="innerChildElement" />

            <HotKeys keyMap={{GRAND_CHILD: 'a'}} id={2}/>
          </HotKeys>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

  context('when there sibling HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <HotKeys keyMap={{CHILD1: 'a'}} id={1}/>
          <HotKeys keyMap={{CHILD1: 'a'}} id={2}/>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

  context('when there is complex nesting of HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div className="outerChildElement" />

          <HotKeys keyMap={{CHILD1: 'a'}} id={1}>
            <HotKeys keyMap={{GRAND_CHILD1: 'a'}} id={2}>
              <HotKeys keyMap={{GREAT_GRAND_CHILD1: 'a'}} id={3}/>
            </HotKeys>
          </HotKeys>

          <HotKeys keyMap={{CHILD2: 'a'}} id={4}>
            <HotKeys keyMap={{GRAND_CHILD2: 'a'}} id={5}/>
          </HotKeys>

          <HotKeys keyMap={{CHILD3: 'a'}} id={6} />
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

  context('when a HotKeys components are unmounted and mounted', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{PARENT: 'a'}} id={0}>
          <div>
            <div className="outerChildElement" />

            <HotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
              <div className="innerChildElement" />

              <HotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} key={2}/>
            </HotKeys>
          </div>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    context('when all of the children are changed for new components', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <HotKeys keyMap={{CHILD: 'a'}} id={1} nextId={3} >
                <div className="innerChildElement" />

                <HotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} nextId={4} />
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

              <HotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
                <div className="innerChildElement" />

                <HotKeys keyMap={{GRAND_CHILD: 'a'}} id={2} key={3}/>
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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

              <HotKeys keyMap={{CHILD: 'a'}} id={1} key={1}>
                <div className="innerChildElement" />
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.componentRegistry.toJSON()).to.eql({
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
