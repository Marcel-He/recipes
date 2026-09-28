import { buildRecipeJsonLd } from './src/assets/lib/jsonld.js';

// Public origin from the host's build env, so JSON-LD image URLs are absolute
const siteUrl = process.env.URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || "";

export default function(eleventyConfig) {
  eleventyConfig.addWatchTarget("src/assets/**/*.scss");

  // schema.org Recipe markup for a recipe page, read by Bring's recipe import
  eleventyConfig.addFilter("recipeJsonLd", (recipes, id, image) => {
    const recipe = (recipes || []).find(r => r.id === id);
    if (!recipe) return "";
    const jsonLd = buildRecipeJsonLd(recipe, { image: image && siteUrl + image });
    return `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`;
  });
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/recipes/**/*.json");
  eleventyConfig.addPassthroughCopy({
    "node_modules/fuse.js/dist/fuse.min.mjs": "assets/fuse.min.mjs"
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
}
