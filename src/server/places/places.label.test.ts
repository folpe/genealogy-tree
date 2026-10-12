import { describe, expect, it } from 'vitest';
import { parsePlaceLabel } from './places.label';

describe('parsePlaceLabel', () => {
  it('lit une commune seule, en France par défaut', () => {
    expect(parsePlaceLabel('Rodez')).toEqual({
      kind: 'locality',
      name: 'Rodez',
      countryCode: undefined,
      department: undefined,
      hint: undefined,
    });
  });

  it('lit un numéro de département entre parenthèses', () => {
    expect(parsePlaceLabel('Rodez (12)')).toMatchObject({
      kind: 'locality',
      name: 'Rodez',
      countryCode: 'FR',
      department: '12',
    });
    expect(parsePlaceLabel('Ajaccio (2A)')).toMatchObject({ department: '2A' });
    expect(parsePlaceLabel('Saint-Denis (974)')).toMatchObject({ department: '974' });
  });

  it('lit un pays entre parenthèses ou après une virgule', () => {
    expect(parsePlaceLabel('Rodez (France)')).toMatchObject({ name: 'Rodez', countryCode: 'FR' });
    expect(parsePlaceLabel('Porto, Portugal')).toMatchObject({ name: 'Porto', countryCode: 'PT' });
    expect(parsePlaceLabel('Hué (Viêt Nam)')).toMatchObject({ name: 'Hué', countryCode: 'VN' });
  });

  it('garde un autre précisant comme indice (département, région)', () => {
    expect(parsePlaceLabel('Rodez, Aveyron')).toMatchObject({
      name: 'Rodez',
      countryCode: undefined,
      department: undefined,
      hint: 'Aveyron',
    });
  });

  it('reconnaît un pays seul', () => {
    expect(parsePlaceLabel('France')).toEqual({ kind: 'country', countryCode: 'FR' });
    expect(parsePlaceLabel('  thaïlande ')).toEqual({ kind: 'country', countryCode: 'TH' });
  });

  it('écarte les libellés qui ne désignent aucun lieu', () => {
    for (const label of ['non renseigné', 'Inconnu', 'Nowhere', '?', '', 'N/A']) {
      expect(parsePlaceLabel(label)).toEqual({ kind: 'unknown' });
    }
  });

  it('développe les abréviations et l’apostrophe typographique', () => {
    expect(parsePlaceLabel('Villeneuve-St-Georges')).toMatchObject({
      name: 'Villeneuve-Saint-Georges',
    });
    expect(parsePlaceLabel('Ste Marie')).toMatchObject({ name: 'Sainte Marie' });
    expect(parsePlaceLabel('L’Hay-les-Roses')).toMatchObject({ name: "L'Hay-les-Roses" });
  });

  it('nomme les arrondissements de Paris, Lyon et Marseille', () => {
    expect(parsePlaceLabel('Paris 13 (France)')).toMatchObject({
      name: 'Paris 13e Arrondissement',
    });
    expect(parsePlaceLabel('Lyon 1er')).toMatchObject({ name: 'Lyon 1er Arrondissement' });
    expect(parsePlaceLabel('Marseille 8ème')).toMatchObject({
      name: 'Marseille 8e Arrondissement',
    });
    expect(parsePlaceLabel('Paris')).toMatchObject({ name: 'Paris' });
  });

  it('ne prend pas une parenthèse vide ou un nom composé pour un précisant', () => {
    expect(parsePlaceLabel('Rodez ()')).toMatchObject({ name: 'Rodez', hint: undefined });
    expect(parsePlaceLabel('Champs-sur-Marne')).toMatchObject({ name: 'Champs-sur-Marne' });
  });
});
