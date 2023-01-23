import { html } from 'lit';
import { component, useState, useRef, useEffect } from 'haunted';

function HomePage() {
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [duration, setDuration] = useState(0)

    return html`
        <style>
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
            }
            .wrapper {
                display: flex;
                flex-direction: column;
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
            .modal {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: absolute;
                top: 200px;
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 0 15px 0 rgba(0,0,0, 0.15);
                width: 600px;
                z-index: 5;
            }
            .close-button {
                all: unset;
                cursor: pointer;
                position: absolute;
                right: 10px;
                top: 10px;
                background-color: #eee;
                border-radius: 50%;
                width: 25px;
                height: 25px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .input {
                width: 100px;
                height: 30px;
                margin-left: 10px;
            }
        </style>
        <div class='wrapper'>
            <h1>The Mementer</h1>
            <button class='button' @click=${() => setNewMementerModalOpen(true)}>
                Create a new Mementer
            </button>
            ${newMementerModalOpen ? (
                html`
                    <div class='modal'>
                        <button class="close-button" @click=${() => setNewMementerModalOpen(false)}>X</button>
                        <h1>Create a new Mementer</h1>
                        <input
                            class='input'
                            type='text'
                            .value=${title}
                            @keyup=${(e: any) => setTitle(e.target.value)}
                            @change=${(e: any) => setTitle(e.target.value)}
                        >
                    </div>
                `
            ): ''}
            
        </div>
    `
}

customElements.define('home-page', component(HomePage))
