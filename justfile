_default:
  just -l

@_check +CMDS:
    echo {{CMDS}} | xargs -n1 sh -c 'if ! command -v $1 >/dev/null 2>&1 /dev/null; then echo "$1 is required!"; exit 1; fi' bash

# install and setup dependencies
setup: (_check "cargo" "bun")
  cargo install mdbook-katex
  cargo install mdbook-pagetoc
  bun install

# start a local server for developing
alias serve := dev
dev: (_check "mdbook")
  mdbook serve

# run the tests
alias t := test
test: (_check "mdbook")
  mdbook test

# build the book
alias b := build
build: (_check "mdbook")
  mdbook build
