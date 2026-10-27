import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Single-user static site — no settings UI for this. Replace with your real
// postal code before relying on the scheduled workflow.
export const PLZ = '00000';

// Confirm these against a live API response for your PLZ before the first
// real run: Aldi is split into regionally distinct Aldi Nord / Aldi Süd in
// Germany, and the code Marktguru expects may differ by region.
export const RETAILERS = ['ALDI', 'LIDL', 'REWE', 'EDEKA', 'KAUFLAND'];

const API = 'https://api.marktguru.de/api/v1/offers/search';
const OUT_FILE = fileURLToPath(new URL('../src/_data/offers.json', import.meta.url));

export function normalizeOffer(raw) {
  return {
    name: raw.name ?? raw.title ?? null,
    retailer: raw.retailerName ?? raw.retailer ?? null,
    price: raw.price?.value ?? raw.price ?? null,
    validUntil: raw.validUntil ?? raw.validTo ?? null,
  };
}

export async function fetchRetailerOffers(retailer, plz = PLZ) {
  const url = `${API}?zipCode=${encodeURIComponent(plz)}&allowedRetailers=${encodeURIComponent(retailer)}&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${retailer}: HTTP ${res.status}`);
  const body = await res.json();
  const rawOffers = body.offers ?? body.results ?? body ?? [];
  return rawOffers.map(normalizeOffer);
}

export async function fetchAllOffers(plz = PLZ) {
  const results = await Promise.allSettled(RETAILERS.map(retailer => fetchRetailerOffers(retailer, plz)));
  const offers = [];
  const failedRetailers = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      offers.push(...result.value);
    } else {
      failedRetailers.push(RETAILERS[i]);
    }
  });
  return { offers, failedRetailers };
}

function isStillValid(offer) {
  if (!offer.validUntil) return true;
  const validUntil = new Date(offer.validUntil);
  if (Number.isNaN(validUntil.getTime())) return true;
  return validUntil.getTime() >= Date.now();
}

async function main() {
  const { offers, failedRetailers } = await fetchAllOffers(PLZ);

  if (failedRetailers.length === RETAILERS.length) {
    console.warn('::warning::Marktguru fetch failed for all retailers, keeping last-known-good offers.json');
    process.exitCode = 1;
    return;
  }

  const cleaned = offers.filter(o => o.name && isStillValid(o));

  const data = {
    fetchedAt: new Date().toISOString(),
    plz: PLZ,
    retailers: RETAILERS,
    failedRetailers,
    offers: cleaned,
  };

  await writeFile(OUT_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  if (failedRetailers.length > 0) {
    console.warn(`::warning::Marktguru fetch failed for: ${failedRetailers.join(', ')}`);
  }
  console.log(`Wrote ${cleaned.length} offers to ${OUT_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
