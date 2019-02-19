# Building an X11 Colour Picker

Links

* <https://github.com/Soft/xcolor/pull/11>
* <https://github.com/Soft/xcolor/pull/14>
* <https://github.com/Soft/xcolor/pull/15>

Story

* what I wanted (link to building a macOS colour picker)
* what was available (link to image/previous version of `xcolor`)
  * X11 window moving around was laggy
  * it was hard to see which pixel I was choosing
  * didn't much like the preview
* implementation
  * tried placing the window under the cursor, didn't work out (things obscured by any window are rendered as pure black, [example](https://github.com/Soft/xcolor/pull/11/files#r525797831)?)
  * needed a way of "zooming" into a section of the window, without obscuring it
  * (light bulb) we could change the cursor!
    * it's faster as well
  * implementation of X APIs
  * show `PixelSquare` struct, with awesome rust indexing
  * if we need more content, `EnsureOdd` trait and macro

---
TODO