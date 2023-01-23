import { LitElement, html } from "lit";
import { property, state } from 'lit/decorators.js';
import { navigator } from "lit-element-router";

class NavLink extends navigator(LitElement) {
    @property()

    href = ''

    constructor() {
        super();
        this.href = "";
    }

    handleClick(e: any) {
        e.preventDefault();
        this.navigate(this.href);
    }

    render() {
        return html`
            <a style="color: red" href="${this.href}" @click="${this.handleClick}">
                <slot></slot>
            </a>
        `
    }
}

customElements.define("nav-link", NavLink);