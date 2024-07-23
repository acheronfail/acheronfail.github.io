# `ffmpeg`


Convert videos to AMV format (for devices like the `AGPTEK A09X`):

```bash, title="shell"
# ensure you have the output dimensions right `-s ...`, since often these
# players don't support dimensions that aren't a match for their display!
ffmpeg -i input.mp4 -ac 1 -ar 22050 -r 25 -block_size 882 -s 320x240 output.amv
```
