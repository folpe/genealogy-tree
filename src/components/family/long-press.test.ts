import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLICK_AFTER_MS, createLongPress, LONG_PRESS_MS } from './long-press';

const finger = (x = 0, y = 0) => ({ x, y, pointerType: 'touch', isPrimary: true });

describe('appui long sur une bulle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('un doigt qui reste posé ouvre les actions de sa bulle, une fois', () => {
    const opened: string[] = [];
    const press = createLongPress((id) => opened.push(id));
    press.down('luc', finger());
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    expect(opened).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(opened).toEqual(['luc']);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(opened).toEqual(['luc']);
  });

  it('un tap, un glissé ou un pincement n’ouvrent rien', () => {
    const opened: string[] = [];
    const press = createLongPress((id) => opened.push(id));
    press.down('luc', finger());
    press.up();
    press.down('luc', finger());
    press.move({ x: 12, y: 0 });
    press.down('paul', { ...finger(40, 0), isPrimary: false });
    press.down('luc', finger());
    press.cancel();
    vi.advanceTimersByTime(LONG_PRESS_MS * 2);
    expect(opened).toEqual([]);
  });

  it('le doigt qui tremble un peu reste un appui', () => {
    const opened: string[] = [];
    const press = createLongPress((id) => opened.push(id));
    press.down('luc', finger(100, 100));
    press.move({ x: 104, y: 97 });
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(opened).toEqual(['luc']);
  });

  it('la souris passe par le clic droit : pas de minuterie', () => {
    const opened: string[] = [];
    const press = createLongPress((id) => opened.push(id));
    press.down('luc', { ...finger(), pointerType: 'mouse' });
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(opened).toEqual([]);
  });

  it('le clic qui suit un appui long est avalé, pas celui d’un tap', () => {
    const press = createLongPress(() => undefined);
    press.down('luc', finger());
    vi.advanceTimersByTime(LONG_PRESS_MS);
    press.up();
    expect(press.swallowClick()).toBe(true);
    expect(press.swallowClick()).toBe(false);
    press.down('luc', finger());
    press.up();
    expect(press.swallowClick()).toBe(false);
  });

  it('sans clic au lever (menu modal, iOS), le prochain clic n’est pas avalé', () => {
    const press = createLongPress(() => undefined);
    press.down('luc', finger());
    vi.advanceTimersByTime(LONG_PRESS_MS);
    press.up();
    vi.advanceTimersByTime(CLICK_AFTER_MS);
    // Entrée au clavier sur une bulle : un clic sans appui avant.
    expect(press.swallowClick()).toBe(false);
  });

  it('se tait une fois démonté : plus d’ouverture en attente', () => {
    const opened: string[] = [];
    const press = createLongPress((id) => opened.push(id));
    press.down('luc', finger());
    press.cancel();
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(opened).toEqual([]);
  });
});
