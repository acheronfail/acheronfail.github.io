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
  echo "#!/usr/bin/env bash\njust pre-commit\n" > .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit

alias serve := dev
# start a local server for developing
dev: (_check "mdbook")
  mdbook serve

pre-commit: (_check "git")
  #!/usr/bin/env bash
  git diff --exit-code >/dev/null
  needs_save=$?

  saved="precommit.diff"
  if [ $needs_save -ne 0 ]; then
    git diff > "$saved"
    git apply -R "$saved"
  fi
  just test
  if [ -f "$saved" ]; then
    git apply "$saved"
    rm "$saved"
  fi

alias t := test
# run the tests
test: (_check "bun" "mdbook") build
  bun test
  mdbook test

# test all external links
test-links: (_check "bun")
  bun run ./tests/test-external-links.ts

alias b := build
# build the book
build: (_check "mdbook")
  mdbook-admonish install
  mdbook-catppuccin install
  mdbook build
