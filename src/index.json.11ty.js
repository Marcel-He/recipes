export default class RecipesIndex {
  data() {
    return {
      permalink: '/index.json',
      eleventyExcludeFromCollections: true
    };
  }

  render({ recipes }) {
    return JSON.stringify(recipes);
  }
}
