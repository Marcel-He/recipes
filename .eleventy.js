export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/recipes/+([a-z0-9-]).json");
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
