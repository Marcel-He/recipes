import { baseIngredients } from './assets/lib/suggestions.js';

export default class RecipesIndex {
  data() {
    return {
      permalink: '/index.json',
      eleventyExcludeFromCollections: true
    };
  }

  render({ collections, recipes }) {
    const ingredientsById = new Map((recipes || []).map(r => [r.id, baseIngredients(r.ingredients)]));
    return JSON.stringify(
      collections.recipe.map(item => ({
        id: item.data.id,
        title: item.data.title,
        difficulty: item.data.difficulty,
        aufwand: item.data.aufwand,
        image: item.data.image,
        // Base ingredients, for the planner's "Passt dazu" suggestions
        ingredients: ingredientsById.get(item.data.id) || [],
      }))
    );
  }
}
