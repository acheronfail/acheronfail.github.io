+++
tags = ['firefox']
+++

# Building Firefox in 2024

I wanted to build Firefox from source this week, and thought I'd write about it since there were a few things that were non-obvious to me.

- [Building Firefox in 2024](#building-firefox-in-2024)
  - [Getting the source](#getting-the-source)
  - [Building Firefox](#building-firefox)
    - [Configure your build with `mozconfig`](#configure-your-build-with-mozconfig)
    - [How to build a different version of Firefox](#how-to-build-a-different-version-of-firefox)
  - [Where to ask for help](#where-to-ask-for-help)

## Getting the source

Follow [Mozilla's documentation](https://firefox-source-docs.mozilla.org/setup/index.html) for your platform on this. You'll need `mercurial` and `python3` at least.

Just make sure when you bootstrap the code, you bootstrap it to use `git` - their documentation describes how, it's something like:

```bash
$ python3 bootstrap.py --vcs=git
```

~~~md tip title="Firefox is officially migrating to git"
Firefox is migrating to `git`, so it's likely that these instructions will be out of date by the time you read this. More on that here:

* <https://glandium.org/blog/?p=4346>
* <https://groups.google.com/a/mozilla.org/g/firefox-dev/c/QnfydsDj48o/m/8WadV0_dBQAJ?pli=1>
~~~

## Building Firefox

There are some tips on building firefox in slightly different ways, such as downloading pre-built artifacts, etc. I did try those at first, but then I found that hardware acceleration didn't work, so I ended up removing all those options and building normally instead.

Firefox has a pretty easy build system, just run `./mach build` and off it goes.

### Configure your build with `mozconfig`

You're building firefox from source, so I presume you want to customise it. Well, you do that with a file called `mozconfig`. Just whack that in your `mozilla-unified` repository, and any options set in there will be read when you `./mach build`.

You can list most of the options with:

```bash title="List all configure options"
$ ./mach configure -- --help
```

Some options I recommend for building a release copy of firefox:

```bash title="Recommended options for a release build"
# Enable Profile Guided Optimisation. Basically, after building firefox, it runs
# firefox with a suite of tests, profiles it, and then re-compiles with that
# added information.
# https://firefox-source-docs.mozilla.org/build/buildsystem/pgo.html
ac_add_options MOZ_PGO=1

# Always bootstrap toolchain, so we don't depend on the host's toolchain.
# This makes the build download the toolchain and uses that instead, which makes
# things a whole lot simpler.
ac_add_options --enable-bootstrap
```

If you want to do a debug build instead of a release build, then add `ac_add_options --enable-debug`.

### How to build a different version of Firefox

If you've just checked everything out, then you should be on the `bookmarks/central` branch. If you build now, you'll get the latest **Firefox Nightly**. But, what if you want to build the **latest release**? What about the **Beta**? Or the latest **Extended Support Release**?

This was non-obvious to me at the beginning, but if you are using `git` just list the remote branches:

```bash title="List firefox versions to build"
# list remote branches
$ git branch -r
origin/HEAD -> origin/branches/default/tip
origin/bookmarks/aurora
origin/bookmarks/autoland
origin/bookmarks/beta
origin/bookmarks/central
origin/bookmarks/fx-team
origin/bookmarks/inbound
origin/bookmarks/release
origin/bookmarks/esr115
...
```

And checkout the particular branch you want to build.


## Where to ask for help

The firefox maintainers are extremely helpful, and should you have any questions at all I wouldn't hesitate to ask. If it's related to building firefox itself, I found asking questions in the [`#developers`](https://chat.mozilla.org/#/room/#developers:mozilla.org) channel worked very well.

Huge thanks for everyone working on firefox - it's a great piece of technology, and surprisingly easy to get setup and build things locally for a project of its age.
