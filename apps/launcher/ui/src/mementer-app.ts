/* eslint-disable no-nested-ternary */
/* eslint-disable no-use-before-define */
import { html, LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client'
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client'
import { router } from 'lit-element-router'
import MementerService from './mementer-service'
import './nav-link'
import './router-outlet'
import './home-page'
import './mementer'

export class MementerApp extends router(LitElement) {
  @property()
  loading: boolean

  route: string

  params: any

  mementerService: null | any

  static get routes() {
    return [
      {
        name: 'home',
        pattern: '',
        data: { title: 'Home' }
      },
      {
        name: 'mementer',
        pattern: 'mementer/:entryHash'
      }
    ]
  }

  constructor() {
    super()
    this.loading = true
    this.route = ''
    this.params = {}
    this.mementerService = null
  }

  router(route: string, params: any, query: any, data: any) {
    this.route = route
    this.params = params
  }

  async connectToHolochain() {
    const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`)
    const appWebsocket = await AppWebsocket.connect(`ws://localhost:${process.env.HC_PORT}`)
    const client = new HolochainClient(appWebsocket)
    const appInfo = await appWebsocket.appInfo({ installed_app_id: 'mementer' })
    const installedCells = appInfo.cell_data
    const mementerCell = installedCells.find(c => c.role_id === 'mementer') as InstalledCell
    const cellClient = new CellClient(client, mementerCell)
    this.mementerService = new MementerService(cellClient)
    this.loading = false
}

  async firstUpdated() { await this.connectToHolochain() }

  render() {
    if (this.loading) return html`<div>Loading...</div>`
    return html`
      <router-outlet active-route=${this.route}>
        <home-page
          route='home'
          shadowRoot=${this.shadowRoot}
          .mementerService=${this.mementerService}
          .route=${this.route}
        ></home-page>
        <the-mementer
          route='mementer'
          shadowRoot=${this.shadowRoot}
          .mementerService=${this.mementerService}
          .route=${this.route}
          .entryHash=${this.params.entryHash}
        ></the-mementer>
      </router-outlet>
    `
  }

  static get scopedElements() { return {} }
}
