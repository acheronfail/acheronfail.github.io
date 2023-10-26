# `acheronfail.github.io`

Uses [mdbook](https://rust-lang.github.io/mdBook/).

## To Do

* [x] markdown support within `div.warning` blocks ([turns out I misunderstood markdown](https://talk.commonmark.org/t/bug-or-expected-markdown-sometimes-doesnt-work-inside-div-tags/4378/4))
  * [x] convert blockquotes back to warnings where appropriate
  * [ ] write a test to ensure appropriate spacing between these blocks?
* [ ] more easy to maintain `SUMMARY`
  * [ ] no need to repeat paths when nesting?
  * [ ] tests for files in `src` that don't exist in `SUMMARY`
* [ ] pre-commit hook for testing
