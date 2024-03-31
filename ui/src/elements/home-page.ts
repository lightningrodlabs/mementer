import { html } from 'lit'
import { component, useState, useEffect } from 'haunted';
import 'lit-flatpickr'
import './settings-modal'
import './help-modal'
import './mementer-card'

function HomePage(props: { shadowRoot: any; route: string; mementerService: any }) {
    const { shadowRoot, route, mementerService } = props
    const [mementers, setMementers] = useState<any[]>([])
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)

    function createMementer(data: any) {
        mementerService!
            .createMementer(data)
            .then((res: any) => {
                console.log("FISH", res)
                setMementers([...mementers, { settings: data, entryHash: res.entryHash }])
                setNewMementerModalOpen(false)
            })
            .catch((error: any) => console.log('createMementer error: ', error))
    }

    useEffect(() => {
        if (mementerService && route === 'home') {
            mementerService
                .getMementers()
                .then((res: any) => setMementers(res))
                .catch((error: any) => console.log(error))
            // Promise.all([
            //     mementerService.getUserDetails(mementerService.myAgentPubKey),
            //     mementerService.getMementers(),
            // ])
            //     .then((data) => {
            //         setUser(data[0])
            //         setMementers(data[1])
            //         setLoading(false)
            //     })
            //     .catch((error) => console.log(error))
        }
    }, [mementerService, route])

    return html`
        <style>
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
            }
            p {
                margin: 0;
            }
            .wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
                background-color: #d0d7e1;
            }
            .container {
                display: flex;
                flex-direction: column;
                justify-content: ${mementers.length ? 'start' : 'center'};
                align-items: center;
                min-height: calc(100vh - 80px);
            }
            .button {
                all: unset;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #44b1f7;
                height: 60px;
                border-radius: 30px;
                padding: 0 20px;
                color: white;
                font-size: 20px;
                flex-shrink: 0;
            }
            .mementer-list {
                display: flex;
                flex-direction: column;
                margin-top: 30px;
            }
            .help-button {
                all: unset;
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: #ccc;
                cursor: pointer;
            }
            .help-button > img {
                width: 30px;
                height: 30px;
                opacity: 0.8;
              }
        </style>
        <div class='wrapper'>
            <h1>The Mementer: The Chronogram of Life</h1>
            <div class='container'>
                <button class='button' @click=${() => setNewMementerModalOpen(true)}>
                    Create Mementer
                </button>
                ${newMementerModalOpen
                    ? html`
                        <settings-modal
                            shadowRoot=${shadowRoot}
                            .location=${'home'}
                            .close=${() => setNewMementerModalOpen(false)}
                            .save=${createMementer}
                        ></settings-modal>
                    `
                    : ''
                }
                ${helpModalOpen ? html`<help-modal .close=${() => setHelpModalOpen(false)}></help-modal>` : ''}
                <div class='mementer-list'>
                    ${mementers.map((mementer) => html`<mementer-card .data=${mementer}></mementer-card>`)}
                </div>
            </div>
            <button class='help-button' @click=${() => setHelpModalOpen(true)}>
                <img src='https://upload.wikimedia.org/wikipedia/commons/f/f8/Question_mark_alternate.svg' alt='help' />
            </button>
        </div>
    `
}

customElements.define('home-page', component(HomePage as any))
