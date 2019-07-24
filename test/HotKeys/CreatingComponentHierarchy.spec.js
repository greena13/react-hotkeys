import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';

import {HotKeys} from '../../src';
import KeyEventManager from '../../src/lib/KeyEventManager';

describe('Creating component hierarchy for HotKeys:', () => {
  beforeEach(function () {
    this.reactDiv = document.createElement('div');

    this.parentKeyMap = {PARENT: 'a'};
    this.childKeyMap = {CHILD: 'a'};
    this.grandChildKeyMap = {GRAND_CHILD: 'a'};

    document.body.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  context('when a HotKeys component is nested in another', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.parentKeyMap} id={0}>
          <div className="outerChildElement" />

          <div className="innerChildElement">
            <HotKeys keyMap={this.childKeyMap} id={1} />
          </div>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
        0: {
          parentId: null,
          childIds: [1],
          keyMap: this.parentKeyMap
        },
        1: {
          parentId: 0,
          childIds: [],
          keyMap: this.childKeyMap
        }
      });
    });
  });

  context('when there are several levels of HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.parentKeyMap} id={0}>
          <div className="outerChildElement" />

          <HotKeys keyMap={this.childKeyMap} id={1}>
            <div className="innerChildElement" />

            <HotKeys keyMap={this.grandChildKeyMap} id={2}/>
          </HotKeys>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
        0: {
          parentId: null,
          childIds: [1],
          keyMap: this.parentKeyMap
        },
        1: {
          parentId: 0,
          childIds: [2],
          keyMap: this.childKeyMap
        },
        2: {
          parentId: 1,
          childIds: [],
          keyMap: this.grandChildKeyMap
        }
      });
    });
  });

  context('when there sibling HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.parentKeyMap} id={0}>
          <div className="outerChildElement" />

          <HotKeys keyMap={this.childKeyMap} id={1}/>
          <HotKeys keyMap={this.childKeyMap} id={2}/>
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then builds the correct component registry', function() {
      expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
        0: {
          parentId: null,
          childIds: [1, 2],
          keyMap: this.parentKeyMap
        },
        1: {
          parentId: 0,
          childIds: [],
          keyMap: this.childKeyMap
        },
        2: {
          parentId: 0,
          childIds: [],
          keyMap: this.childKeyMap
        }
      });
    });
  });

  context('when there is complex nesting of HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.parentKeyMap} id={0}>
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
      expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
        0: {
          parentId: null,
          childIds: [1, 4, 6],
          keyMap: this.parentKeyMap
        },
        1: {
          parentId: 0,
          childIds: [2],
          keyMap: {CHILD1: 'a'}
        },
        2: {
          parentId: 1,
          childIds: [3],
          keyMap: {GRAND_CHILD1: 'a'}
        },
        3: {
          parentId: 2,
          childIds: [],
          keyMap: {GREAT_GRAND_CHILD1: 'a'}
        },
        4: {
          parentId: 0,
          childIds: [5],
          keyMap: {CHILD2: 'a'}
        },
        5: {
          parentId: 4,
          childIds: [],
          keyMap: {GRAND_CHILD2: 'a'}
        },
        6: {
          parentId: 0,
          childIds: [],
          keyMap: {CHILD3: 'a'}
        },
      });
    });
  });

  context('when a HotKeys components are unmounted and mounted', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.parentKeyMap} id={0}>
          <div>
            <div className="outerChildElement" />

            <HotKeys keyMap={this.childKeyMap} id={1} key={1}>
              <div className="innerChildElement" />

              <HotKeys keyMap={this.grandChildKeyMap} id={2} key={2}/>
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

              <HotKeys keyMap={this.childKeyMap} id={1} nextId={3} >
                <div className="innerChildElement" />

                <HotKeys keyMap={this.grandChildKeyMap} id={2} nextId={4} />
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
          0: {
            parentId: null,
            childIds: [3],
            keyMap: this.parentKeyMap
          },
          3: {
            parentId: 0,
            childIds: [4],
            keyMap: this.childKeyMap
          },
          4: {
            parentId: 3,
            childIds: [],
            keyMap: this.grandChildKeyMap
          }
        });
      })
    });

    context('when some of the children are changed for new components', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <HotKeys keyMap={this.childKeyMap} id={1} key={1}>
                <div className="innerChildElement" />

                <HotKeys keyMap={this.grandChildKeyMap} id={2} key={3}/>
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
          0: {
            parentId: null,
            childIds: [1],
            keyMap: this.parentKeyMap
          },
          1: {
            parentId: 0,
            childIds: [3],
            keyMap: this.childKeyMap
          },
          3: {
            parentId: 1,
            childIds: [],
            keyMap: this.grandChildKeyMap
          }
        });
      })
    });

    context('when some of the children are removed', () => {
      beforeEach(function () {
        this.wrapper.setProps({ children: (
            <div>
              <div className="outerChildElement" />

              <HotKeys keyMap={this.childKeyMap} id={1} key={1}>
                <div className="innerChildElement" />
              </HotKeys>
            </div>
          )
        });
      });

      it('then builds the correct component registry', function() {
        expect(KeyEventManager.getFocusOnlyEventStrategy().componentTree.toJSON()).to.eql({
          0: {
            parentId: null,
            childIds: [1],
            keyMap: this.parentKeyMap
          },
          1: {
            parentId: 0,
            childIds: [],
            keyMap: this.childKeyMap
          }
        });
      })
    });
  });
});
