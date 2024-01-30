# 1996 Quake on 2020 Linux

Run the legendary 1996 game on on your modern Linux machine. You know you want to.

<!-- more -->

## Requirements

* `innoextract`: for extracting the game files from the `.exe`
* `bchunk`: for extracting the music files from the game files (optional)
* `sox`: for de-emphasising the extracted music files (optional)

## Extracting and preparing QUAKE's PAK files

First off, go and get the game. This guide will assume you'll be using [the version from GOG](https://www.gog.com/game/quake_the_offering).

To make things simple, here's a script that performs the full extraction for you:

```bash,title="extract_quake.sh"
#!/usr/bin/env bash

set -xe

# Setup some directories
mkdir -p temp quake/id1/music quake/hipnotic/music quake/rogue/music

# Extract the game files from the installer
innoextract setup_quake_the_offering_2.0.0.6.exe --output-dir temp

# Copy the pak files that the modern engines need
cp temp/app/id1/PAK0.PAK      quake/id1/pak0.pak
cp temp/app/id1/PAK1.PAK      quake/id1/pak1.pak
cp temp/app/hipnotic/pak0.pak quake/hipnotic/pak0.pak
cp temp/app/rogue/pak0.pak    quake/rogue/pak0.pak

# Extract the music for each game/expansion
bchunk -w temp/app/game.gog  temp/app/game.cue  quake/id1/music/track      && rm quake/id1/music/track01.iso
bchunk -w temp/app/gamea.gog temp/app/gamea.cue quake/hipnotic/music/track && rm quake/hipnotic/music/track01.iso
bchunk -w temp/app/gamed.gog temp/app/gamed.cue quake/rogue/music/track    && rm quake/rogue/music/track01.iso

# De-emphasise the audio files
for wav in $(find quake -name '*.wav'); do
  sox -V3 "$wav" --comment "" "${wav}.sox.wav" deemph;
  mv "${wav}.sox.wav" "$wav";
done

# Finally, move the prepared folder to where quakespasm expects it (more on running the game below)
mv quake ~/.quakespasm
```

### The Abyss of Pandemonium

There's also the third commercial (now free) expansion, [Abyss of Pandemonium](https://www.quaddicted.com/reviews/aopfm_v2.html)!

You can [download it here](https://www.quaddicted.com/filebase/aopfm_v2.zip).
It's fairly straightforward to install into the same directory:

```bash,title="extract_aopfm_v2.sh"
#!/usr/bin/env bash

# Extract the expansion
unzip aopfm_v2.zip

# Move it to the directory with the other game files
# NOTE: this moves it to where the previous script moved the game files, adjust accordingly for your needs
mv aopfm_v2 ~/.quakespasm/impel
```

## Running the game

There are quite a few ports of the game, but the ones I've tried are [`darkplaces`](http://quakespasm.sourceforge.net/) and [`quakespasm`](https://icculus.org/twilight/darkplaces/).
The latter being a closer representation of what the game was when it was released, and the former bring more modern, compatible and extendable.

~~~admonish tip title="macOS"
`darkplaces` doesn't work on modern versions of macOS due to it being 32bit only.

`quakespasm` on the other hand doesn't have this problem. You can download it here: <http://quakespasm.sourceforge.net/download.htm>
~~~

`quakespam` expects the game directories (i.e., `id1`, `hipnotic`, `rogue`, etc) to be placed at `~/.quakespasm`, and `darkplaces` just wants them in its game directory.
For this guide we've placed them in `~/.quakespasm`, but we can easily run the game via `darkplaces` using its `-basedir` command line argument.

~~~admonish bug collapsible=true title="Issues compiling?"
I ran into some compilation issues when compiling `darkplaces` with GCC 11.
Fortunately I found an [existing fix](https://bugs.gentoo.org/786288#c9): all you have to do is [use this patch](https://gitweb.gentoo.org/repo/gentoo.git/tree/games-fps/darkplaces/files/darkplaces-20140513-gcc-11.patch?id=bc2ba1cd6fdc5a7ad7d161efb21652b73c6b207e) and everything will compile just fine after that.
~~~

With `darkplaces`, here are a few tips:

> If you have a multi-monitor setup, or otherwise just want to run the game in a window, append `-window` to the command line.

```bash,title="QUAKE"
darkplaces-sdl -basedir ~/.quakespasm
```

```bash,title="1st Expansion"
darkplaces-sdl -basedir ~/.quakespasm -game hipnotic
```

```bash,title="2nd Expansion"
darkplaces-sdl -basedir ~/.quakespasm -game rogue
```

```bash,title="3rd Expansion"
darkplaces-sdl -basedir ~/.quakespasm -game impel
```

> As you can see above, `darkplaces-sdl` is the command that's used to run the game.
> There's also `darkplaces-glx` which is identical on the command line but doesn't use SDL.
>
> For more information on that see the [`darkplaces` forums](https://forums.xonotic.org/showthread.php?tid=2640).
> Probably worth just trying both and seeing which works better on your system.

## Final Recommendations

If you haven't already, I highly recommend watching this:

{{ youtube(id="43d8fICz6gM") }}

I gathered information from these links, they might be of use if you need more:

* <https://www.gog.com/forum/quake_series/linux_playability_quake_the_offering>
* <https://www.gog.com/forum/quake_series/quake_the_offering_tweak_guide_video_quakespasm_extracting_audio_deemphasising/page1>
* <https://www.gog.com/forum/quake_series/suggested_autoexeccfg>
