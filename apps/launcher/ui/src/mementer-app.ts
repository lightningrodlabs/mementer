/* eslint-disable no-nested-ternary */
/* eslint-disable no-use-before-define */
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { component, useState, useRef, useEffect } from 'haunted';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { router } from "lit-element-router";
import "./nav-link";
import "./router-outlet";
import './home-page';
import './mementer';

export class MementerApp extends router(LitElement) {
  route: string

  params: any

  static get routes() {
    return [
      {
        name: 'home',
        pattern: '',
        data: { title: 'Home' }
      },
      {
        name: 'game',
        pattern: 'game/:id'
      }
    ]
  }

  constructor() {
    super();
    this.route = '';
    this.params = {};
  }

  router(route: string, params: any, query: any, data: any) {
    this.route = route
    this.params = params
  }

  render() {
    return html`
      <nav-link href="/">Home</nav-link>
      <nav-link href="/game/123">Game</nav-link>
      <router-outlet active-route=${this.route}>
        <home-page route="home" shadowRoot=${this.shadowRoot}></home-page>
        <the-mementer route="game" shadowRoot=${this.shadowRoot}></the-mementer>
      </router-outlet>
    `
  }

  static get scopedElements() { return {} }
}
