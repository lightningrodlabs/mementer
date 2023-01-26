import { html } from 'lit'
import { component, useState, useEffect } from 'haunted';
import 'lit-flatpickr'
import './settings-modal'
import './mementer-card'

function HomePage(props: { shadowRoot: any; route: string; mementerService: any }) {
    const { shadowRoot, route, mementerService } = props
    const [mementers, setMementers] = useState<any[]>([])
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)

    function createMementer(data: any) {
        mementerService!
            .createMementer(data)
            .then((res: any) => {
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
                flex-shrink: 0;
            }
            p {
                margin: 0;
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
            .mementer-list {
                display: flex;
                flex-direction: column;
                margin-top: 30px;
            }
        </style>
        <div class='wrapper'>
            <h1 style='color: white'>The Mementer: The Chronogram of Life</h1>
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
            <div class='mementer-list'>
                ${mementers.map((mementer) => html`<mementer-card .data=${mementer}></mementer-card>`)}
            </div>
        </div>
    `
}

customElements.define('home-page', component(HomePage as any))
