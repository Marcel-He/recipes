export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("recipes/*.json");
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
