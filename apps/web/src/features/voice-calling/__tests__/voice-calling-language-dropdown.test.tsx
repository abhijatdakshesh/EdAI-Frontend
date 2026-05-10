/**
 * @jest-environment jsdom
 *
 * Voice-Calling: language dropdown contract.
 *
 * Verifies the Trigger-Call form lists all 11 supported Indian languages
 * (KAN-voice-multi-lang). Failing this test means the FE drifted from the
 * backend BCP47 / Sarvam language maps in `comms.service.ts`.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Stub heavy shell + repository so this test stays focused on the dropdown.
jest.mock('@/components/layout/shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('../repository', () => ({
  triggerCall: jest.fn(),
  getCallStatus: jest.fn(),
  getCallLogs: jest.fn().mockResolvedValue({ calls: [], total: 0 }),
}));

import { VoiceCalling } from '../voice-calling';

describe('VoiceCalling — language dropdown', () => {
  it('lists all 11 supported Indian languages', () => {
    render(<VoiceCalling />);

    // Locate the language select by finding the option set that contains 'kn'.
    // (Form has two selects: Call Type and Language; this is unambiguous.)
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const langSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'kn'),
    )!;
    expect(langSelect).toBeDefined();

    const values = Array.from(langSelect.options).map((o) => o.value);

    expect(values).toEqual(
      expect.arrayContaining([
        'en', 'hi', 'kn', 'ta', 'te',
        'mr', 'bn', 'gu', 'ml', 'pa', 'or',
      ]),
    );
    expect(values).toHaveLength(11);
  });

  it('renders display labels for the 6 newly added languages', () => {
    render(<VoiceCalling />);

    expect(screen.getByRole('option', { name: 'Marathi' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bengali' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gujarati' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Malayalam' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Punjabi' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Odia' })).toBeInTheDocument();
  });
});
