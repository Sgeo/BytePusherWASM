# BytePusherWASM
This is a [BytePusher](https://esolangs.org/wiki/BytePusher) implementation written largely in WebAssembly's text syntax.
Try on the web: https://sgeo.github.io/BytePusherWASM/
## Caveats
* `requestAnimationFrame` is used without checking framerate, so it may not run correctly on non-60Hz monitors
* Keyboard is not implemented yet.
