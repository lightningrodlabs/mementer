import 'lit-flatpickr'
import { html } from 'lit'
import { component } from 'haunted'

function HelpModal(props: { close: () => void }) {
    const { close } = props

    return html`
        <style>
            * { -webkit-box-sizing: border-box; -moz-box-sizing: border-box }
            h2, h3, p { margin: 0 }
            h2 { width: 100%; text-align: center; margin-bottom: 30px }
            p { margin-bottom: 20px }
            .wrapper {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: rgba(0,0,0,0.5);
                z-index: 10;
            }
            .modal {
                position: relative;
                display: flex;
                flex-direction: column;
                width: 900px;
                background: white;
                border-radius: 20px;
                padding: 50px;
                box-shadow: 0 0 15px 0 rgba(0,0,0, 0.15);
            }
            .close-button {
                all: unset;
                cursor: pointer;
                position: absolute;
                right: 15px;
                top: 15px;
                background-color: #eee;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .close-button > img {
                width: 25px;
                height: 25px;
                opacity: 0.8;
            }
        </style>
        <div class='wrapper'>
            <div class='modal'>
                <button class='close-button' @click=${close}>
                    <img src='https://upload.wikimedia.org/wikipedia/commons/a/a0/OOjs_UI_icon_close.svg' alt='close' />
                </button>
                <h2>About The Mementer</h2>
                <p>The Mementer is a reminder of where you are on the clock in the game of life.</p>
                <p>The Mementer is a programmable chronogram that measures the player's position within the context of what is defined as serious play.</p>
                <p>Serious play can be best understood as:</p>
                <div style='padding-left: 30px'>
                    <p>a. the process by which individual units of focused attention are afforded to play</p>
                    <p>b. in a bid to exact a cumulative increase in the intensity of said attention</p>
                    <p>c. such that the player is actively sent into limited / extended flow states</p>
                    <p>d. elevating the quality of both the interactions and outcomes</p>
                    <p>e. of the player(s) and the game as a whole.</p>
                </div>
                <p>
                    The Mementer is a play-based dynamic recordkeeper that puts finite and infinite games in context over time for a 
                    player that is looking to deepen one's understanding, involvement and celebration of life.
                </p>
                <p>
                    The Mementer allows players to design their own chronology, dividing time into units which feel right to them. 
                    It is a path to liberation from the hegemony of 24/7/365 time into an exploration of neochronos - time made anew.
                </p>
                <p>The visual representation of the Mementer is modelled around the form of an apple.</p>
                <p>
                    It is primarily to symbolize the true nature of time and entropy. That change and decay being verifiable constants 
                    in life, it is up to each one of us to decide whether or not we play a more conscious and active role or simply watch 
                    on as time ferries us back to our original state.
                </p>
                <p>The Mementer serves as a memento (reminder) to the ludi (game) of life.</p>
            </div>
        </div>
    `
}

customElements.define('help-modal', component(HelpModal as any))
