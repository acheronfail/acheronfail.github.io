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
dev:
  mdbook serve

# run the tests
test:
  mdbook test

# build the book
build:
  mdbook build
