import { snapshot } from '../../jest-utils';
import Main from './Main';
import { TEST_PROPS } from '../bootstrap-test-config';
import React from 'react';

describe('Main View Tests', () => {
  const testProps = TEST_PROPS;

  describe('render', () => {
    it('should render', async () => {
      snapshot(<Main {...testProps} />);
    });
  });
});
