import * as sass from 'sass';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class StyleSheet {
  data() {
    return {
      permalink: 'assets/style.css',
      eleventyExcludeFromCollections: true,
    };
  }

  render() {
    const result = sass.compile(resolve(__dirname, 'style.scss'));
    return result.css;
  }
}
