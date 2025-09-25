import { expect } from 'chai';

import { defaultUnsetMessage, ensureDefined } from './environment';

describe('environment', () => {
  describe('ensureDefined', () => {
    it('returns the input if all values are defined', () => {
      const envVars = {
        FOO: 'Unit',
        BAR: 'Test',
      };

      expect(ensureDefined(envVars)).to.equal(envVars);
    });

    it('throws an error with the list of undefined keys', () => {
      const envVars = {
        FOO: undefined,
        BAR: undefined,
        UNIT: 'Test',
      };

      expect(() => ensureDefined(envVars)).to.throw('FOO, BAR must be set in the environment');
    });

    it('throws an error with a custom undefined keys error message', () => {
      const envVars = {
        FOO: undefined,
        BAR: undefined,
        UNIT: 'Test',
      };

      expect(() => {
        ensureDefined(envVars, (unset) => `${unset.join(', ')} are required`);
      }).to.throw('FOO, BAR are required');
    });
  });

  describe('defaultUnsetMessage', () => {
    it('returns the expected message', () => {
      expect(defaultUnsetMessage(['FOO'])).to.equal('FOO must be set in the environment');
      expect(defaultUnsetMessage(['FOO', 'BAR'])).to.equal('FOO, BAR must be set in the environment');
    });
  });
});
