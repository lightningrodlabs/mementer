# Mementer

A Chronogram

## Installation

1. Install the holochain dev environment: https://developer.holochain.org/docs/install/
2. Clone this repo: `git clone https://github.com/lightningrodlabs/mementer && cd ./mementer`
3. Enter the nix shell: `nix develop`
4. Install the dependencies with: `npm install`

## UI

To test out the UI as a stand alone holochain app run:


``` bash
npm run dev
```

and point your web-browser at `localhost:8888`

To test the UI in the context of the Weave run:


``` bash
npm run tool-dev
```

## Package

To package the web happ:

``` bash
npm run package
```

You'll have the `mementer.webhapp` in `workdir`, and it's component `mementer.happ` in `dna/workdir/happ`, and `ui.zip` in `ui/apps/mementer`.

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2024, Lighning Rod Labs, based on [code](https://github.com/holochain/how) Copyright (C) Holochain Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
