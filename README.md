# `acheronfail.github.io`

Uses [mdbook](https://rust-lang.github.io/mdBook/).

## To Do

* [x] date that each page was last updated
* [ ] codeblock titles
  * [ ] add them in retroactively
* [ ] markdown support within `div.warning` blocks
  * [ ] convert blockquotes back to warnings where appropriate
* [ ] more easy to maintain `SUMMARY`
  * [ ] no need to repeat paths when nesting?
  * [ ] tests for files in `src` that don't exist in `SUMMARY`
* [ ] better inline code styles in headers
* [ ] pre-commit hook for testing
* [x] shortcodes/snippets
  * [x] youtube links
* [ ] use `bun` in preprocessor scripts (currently has some stdin issues)
  * https://github.com/oven-sh/bun/issues/5240
  * https://github.com/oven-sh/bun/issues/1607
