import { html } from 'lit';
import { component, useState, useRef, useEffect } from 'haunted';
import 'lit-flatpickr';
import './settings-modal';

function HomePage(props: { shadowRoot: any }) {
    const { shadowRoot } = props
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)

    function onSave(data: any) {
        console.log('new mementer data: ', data)
    }

    return html`
        <style>
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
            }
            p {
                margin: 0;
            }
            .row {
                display: flex;
            }
            .column {
                display: flex;
                flex-direction: column;
            }
            .wrapper {
                align-items: center;
                width: 100%;
                height: 100%;
                background-color: #303030;
            }
            .button {
                all: unset;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #44b1f7;
                height: 40px;
                border-radius: 20px;
                padding: 0 20px;
                color: white;
            }
        </style>
        <div class='wrapper column'>
            <h1 style='color: white'>The Mementer: The Chronogram of Life</h1>
            <button class='button' @click=${() => setNewMementerModalOpen(true)}>
                Create Mementer
            </button>
            ${newMementerModalOpen
                ? html`
                    <settings-modal
                        shadowRoot=${shadowRoot}
                        .close=${() => setNewMementerModalOpen(false)}
                        .onSave=${onSave}
                    ></settings-modal>
                `
                : ''}
        </div>
    `
}

customElements.define('home-page', component(HomePage))
