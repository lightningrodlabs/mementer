// import {
//     Button,
// } from '@scoped-elements/material-web';
import { html, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

// import { EntryHash } from '@holochain/client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

export class Mementer extends ScopedElementsMixin(LitElement) {
    // @property()
    // mementerHash!: EntryHash;

    @state()
    _foo = "Hello!";

    render() {
        return html`A mementer chronogram: ${this._foo}`
    //     return html` <mwc-button
    //     style="flex: 1"
    //     raised
    //     label="My Button"
    //     @click=${() => {
    //       this._foo = `${new Date}`
    //     }}
    //   ></mwc-button>`
    }

    static get scopedElements() {
        return {
//          'mwc-button': Button,
        }
    }
}