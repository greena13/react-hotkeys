import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';

import {HotKeys} from '../../src/';

describe('Using ref prop:', function () {
  describe('when the ref prop is given a function', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys ref={(ref) => this.ref = ref } className='outer'>
          <div className="childElement" />
        </HotKeys>
      );
    });

    it('then correctly passes the reference to the wrapping DOM-mountable component', function() {
      expect(this.ref).to.not.be.undefined;
    });
  });
});
