/**
 * @format
 */
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@op-engineering/op-sqlite', () => ({
  open: () => ({
    execute: jest.fn().mockResolvedValue({ rows: [] }),
    executeBatch: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: false, isInternetReachable: false }),
}));

jest.mock('react-native-geolocation-service', () => ({
  __esModule: true,
  default: { getCurrentPosition: jest.fn() },
}));

import App from '../App';

test('renders the employee workspace', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer.root.findAllByProps({ children: 'REBS HRMS' }).length).toBeGreaterThan(0);
});
