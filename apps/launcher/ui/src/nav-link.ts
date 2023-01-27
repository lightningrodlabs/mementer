import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'
import { navigator } from 'lit-element-router'

class NavLink extends navigator(LitElement) {
    @property()
    href = ''

    constructor() {
        super()
        this.href = ''
    }

    handleClick(e: any) {
        e.preventDefault()
        this.navigate(this.href)
    }

    render() {
        return html`
            <a style='color: white; text-decoration: none' href='${this.href}' @click='${this.handleClick}'>
                <slot></slot>
            </a>
        `
    }
}

customElements.define('nav-link', NavLink);