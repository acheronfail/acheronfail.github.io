_default:
  just -l

@_check +CMDS:
    echo {{CMDS}} | xargs -n1 sh -c 'if ! command -v $1 >/dev/null 2>&1 /dev/null; then echo "$1 is required!"; exit 1; fi' bash

# install and setup dependencies
setup: (_check "cargo" "bun")
  cargo install mdbook-katex
  cargo install mdbook-admonish
  cargo install mdbook-catppuccin
  bun install
  if [ -z ${CI:-} ]; then just hooks; fi

# setup hooks
hooks:
  echo "#!/usr/bin/env bash\njust test\n" > .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit

alias serve := dev
# start a local server for developing
dev: (_check "mdbook")
  mdbook serve

alias t := test
# run the tests
test: (_check "bun" "mdbook" "git") build
  git diff > precommit.diff
  git apply -R precommit.diff
  bun test
  mdbook test
  git apply precommit.diff
  rm precommit.diff

# test all external links
test-links: (_check "bun")
  bun run ./tests/test-external-links.ts

alias b := build
# build the book
build: (_check "mdbook")
  mdbook-admonish install
  mdbook-catppuccin install
  mdbook build
