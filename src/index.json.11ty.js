import { baseIngredients } from './assets/lib/suggestions.js';
import { matchOffers } from './assets/lib/offers.js';

export default class RecipesIndex {
  data() {
    return {
      permalink: '/index.json',
      eleventyExcludeFromCollections: true
    };
  }

  render({ collections, recipes, offers }) {
    const ingredientsById = new Map((recipes || []).map(r => [r.id, baseIngredients(r.ingredients)]));
    const offerList = offers?.offers || [];
    return JSON.stringify(
      collections.recipe.map(item => {
        const ingredients = ingredientsById.get(item.data.id) || [];
        return {
          id: item.data.id,
          title: item.data.title,
          difficulty: item.data.difficulty,
          aufwand: item.data.aufwand,
          image: item.data.image,
          description: item.data.description,
          // Base ingredients, for the planner's "Mit ähnlichen Zutaten" suggestions
          ingredients,
          // Base ingredients currently on a local offer, with the retailer — for the
          // day-select drawer's "X (Markt)" badge. See docs/superpowers/specs/2026-10-27-lokale-angebote-design.md
          offerMatches: matchOffers(ingredients, offerList).map(m => ({ ingredient: m.ingredient, retailer: m.offer.retailer })),
        };
      })
    );
  }
}
