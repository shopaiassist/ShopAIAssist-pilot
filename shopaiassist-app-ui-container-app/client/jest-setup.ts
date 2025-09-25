// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('@/core-components/react', () => require('./__mocks__/saffron'));
jest.mock('zustand', () => require('./__mocks__/zustand'));
