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
            <style>
                .wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    color: white;
                    text-decoration: none;
                }
            </style>
            <a class='wrapper' href='${this.href}' @click='${this.handleClick}'>
                <slot></slot>
            </a>
        `
    }
}

customElements.define('nav-link', NavLink);