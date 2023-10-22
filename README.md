# `acheronfail.github.io`

Uses [mdbook](https://rust-lang.github.io/mdBook/).

## To Do

* [x] date that each page was last updated
* [x] codeblock titles (preprocessor to find three backticks with a title="xxx" and then wrap in `div`)
  * [x] add them in retroactively
* [x] markdown support within `div.warning` blocks ([turns out I misunderstood markdown](https://talk.commonmark.org/t/bug-or-expected-markdown-sometimes-doesnt-work-inside-div-tags/4378/4))
  * [x] convert blockquotes back to warnings where appropriate
  * [ ] write a test to ensure appropriate spacing between these blocks?
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
