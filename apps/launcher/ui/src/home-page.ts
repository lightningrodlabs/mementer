import { html } from 'lit';
import { component, useState, useRef, useEffect } from 'haunted';
import 'lit-flatpickr';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import MementerService from './mementer-service'
import './settings-modal';

function HomePage(props: { shadowRoot: any }) {
    const { shadowRoot } = props
    const [loading, setLoading] = useState(false)
    const [mementerService, setMementerService] = useState<any>(null)
    const [mementers, setMementers] = useState<any[]>([])
    const [newMementerModalOpen, setNewMementerModalOpen] = useState(false)

    async function connectToHolochain() {
        const url = `ws://localhost:${process.env.HC_PORT}`
        const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`)
        const appWebsocket = await AppWebsocket.connect(url)
        const client = new HolochainClient(appWebsocket)
        const appInfo = await appWebsocket.appInfo({ installed_app_id: 'mementer' })
        const installedCells = appInfo.cell_data
        const mementerCell = installedCells.find(c => c.role_id === 'mementer') as InstalledCell
        const cellClient = new CellClient(client, mementerCell)
        setMementerService(new MementerService(cellClient))
        setLoading(false)
    }

    function onSave(data: any) {
        console.log('new mementer data: ', data)
        mementerService!
            .createMementer(data)
            .then((res: any) => console.log('new mementer res: ', res))
            .catch((error: any) => console.log('new mementer error: ', error))
    }

    useEffect(() => connectToHolochain(), [])

    useEffect(() => {
        if (mementerService) {
            mementerService
                .getMementers()
                .then((res: any) => {
                    console.log('getMementers res: ', res)
                    setMementers(res)
                })
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
