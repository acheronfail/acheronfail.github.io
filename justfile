MDBOOK_VERSION := "0.5.4"

_default:
  just -l

@_check +CMDS:
    echo {{CMDS}} | xargs -n1 sh -c 'if ! command -v $1 >/dev/null 2>&1 /dev/null; then echo "$1 is required!"; exit 1; fi' bash

# verify the local mdbook version matches the repository pin
check-mdbook: (_check "mdbook")
  #!/usr/bin/env bash
  set -euo pipefail
  actual="$(mdbook --version | awk '{print $2}')"
  expected="v{{MDBOOK_VERSION}}"
  if [ "$actual" != "$expected" ]; then
    echo "mdbook $expected is required, but found $actual."
    echo "Run: cargo install mdbook --version {{MDBOOK_VERSION}} --locked --force"
    exit 1
  fi

# install and setup dependencies
setup: (_check "cargo" "npm")
  cargo install mdbook --version {{MDBOOK_VERSION}} --locked --force
  npm ci
  if [ -z ${CI:-} ]; then just hooks; fi
  just build

# setup hooks
hooks:
  echo -e "#!/usr/bin/env bash\njust pre-commit\n" > .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit

alias serve := dev
# start a local server for developing
dev: check-mdbook
  mdbook serve

pre-commit: (_check "git")
  #!/usr/bin/env bash
  set -uo pipefail

  git diff --exit-code >/dev/null
  needs_save=$?

  set -e

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
test: (_check "npm") build
  npm test
  npm run typecheck
  mdbook test

# test all external links
test-links: (_check "npm")
  npm run test:links

alias b := build
# build the book
build: check-mdbook
  mdbook build
  node --experimental-strip-types scripts/seo.ts
