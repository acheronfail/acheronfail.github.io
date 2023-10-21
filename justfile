_default:
  just -l

dev:
  mdbook serve

test:
  mdbook test

build:
  mdbook build
