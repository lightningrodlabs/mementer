import { html } from 'lit'
import { component, useState, useRef, useEffect } from 'haunted';
import 'lit-flatpickr'
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client'
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client'
import { serializeHash } from '@holochain-open-dev/utils'
import MementerService from './mementer-service'
import './settings-modal'
import './mementer-card'

function HomePage(props: { shadowRoot: any }) {
    const { shadowRoot } = props
    const [loading, setLoading] = useState(true)
    const [mementerService, setMementerService] = useState<any>(null)
    const [mementers, setMementers] = useState<any[]>([])
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)

    async function connectToHolochain() {
        const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`)
        const appWebsocket = await AppWebsocket.connect(`ws://localhost:${process.env.HC_PORT}`)
        const client = new HolochainClient(appWebsocket)
        const appInfo = await appWebsocket.appInfo({ installed_app_id: 'mementer' })
        const installedCells = appInfo.cell_data
        const mementerCell = installedCells.find(c => c.role_id === 'mementer') as InstalledCell
        const cellClient = new CellClient(client, mementerCell)
        setMementerService(new MementerService(cellClient))
        setLoading(false)
    }

    function createMementer(data: any) {
        mementerService!
            .createMementer(data)
            .then((res: any) => {
                setMementers([...mementers, { settings: data, entryHash: res.entryHash }])
                setNewMementerModalOpen(false)
            })
            .catch((error: any) => console.log('createMementer error: ', error))
    }

    useEffect(() => connectToHolochain(), [])

    useEffect(() => {
        if (mementerService) {
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
    }, [mementerService])

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
                        .heading=${'Create a new Mementer'}
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

customElements.define('home-page', component(HomePage))
