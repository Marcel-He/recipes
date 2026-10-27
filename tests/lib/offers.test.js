import { describe, it, expect } from 'vitest';
import { matchOffers, countOfferMatches } from '../../src/assets/lib/offers.js';

describe('matchOffers', () => {
  const offers = [
    { name: 'Rinderhack 500g', retailer: 'REWE', price: 3.49, validUntil: '2099-01-01' },
    { name: 'Paprika rot/gelb/grün', retailer: 'ALDI', price: 1.29, validUntil: '2099-01-01' },
  ];

  it('matches a base ingredient against an offer name', () => {
    const result = matchOffers(['Rinderhack', 'Zucchini'], offers);
    expect(result).toEqual([{ ingredient: 'Rinderhack', offer: offers[0] }]);
  });

  it('matches fuzzily across word order/extra words', () => {
    const result = matchOffers(['Paprika'], offers);
    expect(result).toEqual([{ ingredient: 'Paprika', offer: offers[1] }]);
  });

  it('excludes ingredient names shorter than 3 characters', () => {
    const shortOffers = [{ name: 'Ei', retailer: 'REWE', price: 0.3, validUntil: '2099-01-01' }];
    expect(matchOffers(['Ei'], shortOffers)).toEqual([]);
  });

  it('returns nothing when there are no offers', () => {
    expect(matchOffers(['Rinderhack'], [])).toEqual([]);
    expect(matchOffers(['Rinderhack'], undefined)).toEqual([]);
  });

  it('returns nothing when no ingredient matches', () => {
    expect(matchOffers(['Zucchini'], offers)).toEqual([]);
  });
});

describe('countOfferMatches', () => {
  const offers = [
    { name: 'Rinderhack 500g', retailer: 'REWE', price: 3.49, validUntil: '2099-01-01' },
    { name: 'Paprika rot/gelb/grün', retailer: 'ALDI', price: 1.29, validUntil: '2099-01-01' },
  ];

  it('counts matched ingredients', () => {
    expect(countOfferMatches(['Rinderhack', 'Paprika', 'Zucchini'], offers)).toBe(2);
  });
});
