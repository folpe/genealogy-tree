// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { load, push } = vi.hoisted(() => ({ load: vi.fn(), push: vi.fn() }));
vi.mock('@/actions/family.actions', () => ({ searchDirectoryAction: load }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { CommandPalette } from './command-palette';

beforeAll(() => {
  // cmdk mesure la liste et fait défiler l'élément actif : jsdom n'a ni l'un ni l'autre.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});

describe('CommandPalette', () => {
  beforeEach(() => {
    load.mockReset();
    push.mockReset();
    localStorage.clear();
  });

  it('une erreur de chargement ne relance pas en boucle ; « Réessayer » relance une fois', async () => {
    load.mockRejectedValueOnce(new Error('réseau'));
    load.mockResolvedValueOnce({ persons: [], relations: {}, proximity: {} });
    render(<CommandPalette />);
    await userEvent.click(screen.getByRole('button', { name: 'Trouver quelqu’un' }));
    expect(await screen.findByText(/n’a pas pu être chargée/)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(load).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText(/Tape un prénom/)).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('⌘K ouvre et ferme ; l’annuaire ne se charge qu’une fois', async () => {
    load.mockResolvedValue({ persons: [], relations: {}, proximity: {} });
    render(<CommandPalette />);
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Trouver quelqu’un' })).toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(await screen.findByText(/Tape un prénom/)).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
