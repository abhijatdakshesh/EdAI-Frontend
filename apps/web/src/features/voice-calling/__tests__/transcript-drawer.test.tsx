/**
 * @jest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react';
import { TranscriptDrawer } from '../transcript-drawer';
import { useTranscriptStore } from '../transcript-store';

function resetStore() {
  useTranscriptStore.setState({ byCallId: {} });
}

describe('TranscriptDrawer', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders waiting message when no turns yet', () => {
    render(<TranscriptDrawer callId="call-empty" live />);
    expect(screen.getByText(/waiting for the call/i)).toBeInTheDocument();
  });

  it('renders turns in order with role-distinct bubbles', () => {
    act(() => {
      useTranscriptStore.getState().appendTurn('call-1', { turn: 0, role: 'AI', text: 'Hello', language: 'en', ts: '2026-05-08T10:00:00Z' });
      useTranscriptStore.getState().appendTurn('call-1', { turn: 1, role: 'PARENT', text: 'Hi', language: 'en', ts: '2026-05-08T10:00:05Z' });
      useTranscriptStore.getState().appendTurn('call-1', { turn: 2, role: 'AI', text: 'How can I help?', language: 'en', ts: '2026-05-08T10:00:10Z' });
    });

    render(<TranscriptDrawer callId="call-1" live />);

    const aiBubbles = screen.getAllByTestId('transcript-bubble-ai');
    const parentBubbles = screen.getAllByTestId('transcript-bubble-parent');
    expect(aiBubbles).toHaveLength(2);
    expect(parentBubbles).toHaveLength(1);

    // Order check: turn-0 first
    const allBubbles = Array.from(
      screen.getByTestId('transcript-drawer').querySelectorAll('[data-role]'),
    );
    expect(allBubbles[0]?.getAttribute('data-role')).toBe('AI');
    expect(allBubbles[1]?.getAttribute('data-role')).toBe('PARENT');
    expect(allBubbles[2]?.getAttribute('data-role')).toBe('AI');

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText('How can I help?')).toBeInTheDocument();
  });

  it('shows Live pill when live=true', () => {
    render(<TranscriptDrawer callId="call-live" live />);
    expect(screen.getByTestId('transcript-live-pill')).toBeInTheDocument();
    expect(screen.queryByTestId('transcript-completed-pill')).not.toBeInTheDocument();
  });

  it('shows Completed pill when live=false', () => {
    render(<TranscriptDrawer callId="call-done" live={false} />);
    expect(screen.getByTestId('transcript-completed-pill')).toBeInTheDocument();
    expect(screen.queryByTestId('transcript-live-pill')).not.toBeInTheDocument();
  });

  it('dedupes duplicate turns by index', () => {
    act(() => {
      useTranscriptStore.getState().appendTurn('call-dup', { turn: 0, role: 'AI', text: 'First', language: 'en', ts: 't1' });
      useTranscriptStore.getState().appendTurn('call-dup', { turn: 0, role: 'AI', text: 'First-retry', language: 'en', ts: 't2' });
    });
    render(<TranscriptDrawer callId="call-dup" live />);
    const aiBubbles = screen.getAllByTestId('transcript-bubble-ai');
    expect(aiBubbles).toHaveLength(1);
    expect(screen.getByText('First-retry')).toBeInTheDocument();
  });

  it('falls back to store live state when prop omitted', () => {
    act(() => {
      useTranscriptStore.getState().setLive('call-store', true);
    });
    render(<TranscriptDrawer callId="call-store" />);
    expect(screen.getByTestId('transcript-live-pill')).toBeInTheDocument();
  });
});
