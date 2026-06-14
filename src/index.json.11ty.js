export default class RecipesIndex {
  data() {
    return {
      permalink: '/index.json',
      eleventyExcludeFromCollections: true
    };
  }

  render({ collections }) {
    return JSON.stringify(
      collections.recipe.map(item => ({
        id: item.data.id,
        title: item.data.title,
        difficulty: item.data.difficulty,
        aufwand: item.data.aufwand,
      }))
    );
  }
}
