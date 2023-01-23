import { LitElement, html } from "lit";
import { outlet } from "lit-element-router";

class RouterOutlet extends outlet(LitElement) {
  render() {
    return html` <slot></slot> `;
  }
}

customElements.define("router-outlet", RouterOutlet);