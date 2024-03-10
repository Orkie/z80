# z80
Z80 homebrew computer

Schematics and code for a Z80 computer I put together.

Code requires z80asm: https://www.nongnu.org/z80asm/

`adan-z80.drives` contains a suitable format definition for cpmtools, add this to `/usr/share/diskdefs`.

## DeZog
Comes with a DeZog setup for debugging applications written for this machine. It requires a bespoke version of the DeZog extension, the following should be added to customcode.ts to expose some required APIs: 
```
        public fs = require("fs");
        public vscode = require("vscode");

```

