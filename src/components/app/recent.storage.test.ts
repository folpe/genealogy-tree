// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { readRecent, writeRecent } from './recent.storage';

describe('fiches récemment consultées', () => {
  beforeEach(() => localStorage.clear());

  it('se relisent depuis l’appareil', () => {
    writeRecent(['luc', 'paul']);
    expect(readRecent()).toEqual(['luc', 'paul']);
  });

  it('reprennent la liste d’avant le renommage, puis l’oublient', () => {
    localStorage.setItem('ances-tree:recent', JSON.stringify(['anne']));
    expect(readRecent()).toEqual(['anne']);
    expect(localStorage.getItem('ances-tree:recent')).toBeNull();
    expect(localStorage.getItem('racines:recent')).toBe('["anne"]');
  });

  it('ignorent une valeur illisible', () => {
    localStorage.setItem('racines:recent', '{oops');
    expect(readRecent()).toEqual([]);
  });
});
