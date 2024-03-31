import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";


import { sharedStyles } from "../sharedStyles";
import {mementerContext, Dictionary } from "../types";
import { MementerStore } from "../mementer.store";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { AsyncReadable, AsyncStatus, StoreSubscriber } from '@holochain-open-dev/stores';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/menu-item/menu-item.js";
import "@shoelace-style/shoelace/dist/components/menu/menu.js";
import SlDropdown from '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import sanitize from "sanitize-filename";
import './home-page'
import { router } from 'lit-element-router'
import './router-outlet'
import './mementer'

import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, List, Icon,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import { consume } from '@lit/context';
import { MementerMyProfileDialog } from "./mementer-my-profile-dialog";
import { EntryRecord } from "@holochain-open-dev/utils";
import { isWeContext } from "@lightningrodlabs/we-applet";

/**
 * @element mementer-controller
 */
export class MementerController extends router(LitElement) {
  constructor() {
    super();
    this.route = ''
    this.params = {}
  }

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
        name: 'mementer',
        pattern: 'mementer/:entryHash'
      }
    ]
  }

  router(route: string, params: any, query: any, data: any) {
    this.route = route
    this.params = params
  }
  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy = false;

  /** Dependencies */

  @consume({ context: mementerContext, subscribe: true })
  _store!: MementerStore;

  @consume({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;


  _myProfile!: StoreSubscriber<AsyncStatus<EntryRecord<Profile> | undefined>>;
  @query("mementer-my-profile")
  _myProfileDialog!:MementerMyProfileDialog


  @query("#file-input")
  _fileInput!: HTMLElement

  /** Private properties */
  @state()
  private initialized = false;
  private initializing = false;


  async createDummyProfile() {
    const nickname = "Cam";
    const avatar = "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png";

    try {
      const fields: Dictionary<string> = {};
       if (avatar) {
         fields['avatar'] = avatar;
       }
      await this._profiles.client.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
    }
  }


  get myNickName(): string {
    if (this._myProfile.value.status == "complete") {
      const profile = this._myProfile.value.value;
      if (profile)
        return profile.entry.nickname
    }
    return ""
  }
  get myAvatar(): string {
    if (this._myProfile.value.status == "complete") {
      const profile = this._myProfile.value.value;
      if (profile)
        return profile.entry.fields.avatar
    }
    return ""
  }


  private async subscribeProfile() {

    this._myProfile = new StoreSubscriber(
      this,
      () => this._profiles.myProfile
    );
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
  }
 
  clickCount = 0
  @state() showInit = false
  adminCheck = () => { 
    this.clickCount += 1
    if (this.clickCount == 5) {
      this.clickCount = 0
      this.showInit = true
    }
  }

  render() {
    return html`

  <mementer-my-profile></mementer-my-profile>
    <router-outlet active-route=${this.route}>

        <home-page
          route='home'
          shadowRoot=${this.shadowRoot}
          .mementerService=${this._store.service}
          .route=${this.route}
        ></home-page>
        <the-mementer
          route='mementer'
          shadowRoot=${this.shadowRoot}
          .mementerService=${this._store.service}
          .route=${this.route}
          .entryHash=${this.params.entryHash}
        ></the-mementer>
    </router-outlet>

`;
  }


  static get scopedElements() {
    return {
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      'mementer-my-profile': MementerMyProfileDialog,
//      'mementer-settings': MementerSettings,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
        }

        #top-bar {
          margin: 10px;
          align-items: center;
          justify-content: flex-end;
        }
        #top-bar-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-right: auto;
        }
        .appBody {
          margin-top: 10px;
          margin-left: 20px;
          margin-right: 20px;
          margin-bottom: 20px;
          display:flex;
        }
        .initializing {
          width: 100vw;
          display: block;
          height: 100vh;
          background-image: url(/images/dweb-background.jpg);
          background-size: cover;
          overflow-y: scroll;
        }

        .initializing .wrapper {
          display: block;
          height: 100%;
          max-width: 320px;
          margin: 0 auto;
        }


        .about-event {
          padding: 20px;
          
        }
        .about-event h3 {
          text-align: center;
        }

        .about-event p {
          font-size: 14px;
          text-align: center;
          margin-top: 15px;
          margin-bottom: 0;
        }
        .mementer-welcome {
          width: 200px;
          margin: 0 auto;
          display: block;
        }
        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
