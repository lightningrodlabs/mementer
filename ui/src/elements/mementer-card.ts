import { html } from 'lit'
import { component } from 'haunted'
import { findDuration, durationText } from './helpers'
import './settings-modal'
import './mementer-preview'
import './duration-bar'
import './nav-link'
import { encodeHashToBase64 } from '@holochain/client'

function MementerCard(props: { data: any }) {
    const { data } = props
    const { entryHash, settings } = data
    const { title, startDate, endDate, largeSlices, mediumSlices, smallSlices } = settings

    return html`
        <style>
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
            }
            h1 { margin: 0 0 20px 0 }
            p { margin: 0 0 10px 0 }
            .wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 600px;
                padding: 30px;
                margin-bottom: 20px;
                background-color: white;
                border-radius: 20px;
            }
            .row {
                display: flex;
                justify-content: space-between;
                width: 100%;
                margin-bottom: 20px;
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
                width: 84px;
                color: white;
            }
        </style>
        <div class='wrapper'>
            <h1 class='title'>${title}</h1>
            <mementer-preview .slices=${{ large: largeSlices, medium: mediumSlices, small: smallSlices }}></mementer-preview>
            <duration-bar
                .startDate=${startDate}
                .endDate=${endDate}
                .size=${'small'}
                style='width: 100%; margin-bottom: 20px'
            ></duration-bar>
            <div class='row'>
                <p>${startDate}</p>
                <p>${durationText(findDuration(startDate, endDate))}</p>
                <p>${endDate}</p>
            </div>
            <div class='row'>
                <p>Large Slices: ${largeSlices}</p>
                <p>Medium Slices: ${mediumSlices}</p>
                <p>Small Slices: ${smallSlices}</p>
            </div>
            <nav-link class='button' href='/mementer/${encodeHashToBase64(entryHash)}'>Open</nav-link>
        </div>
    `
}

customElements.define('mementer-card', component(MementerCard as any))
