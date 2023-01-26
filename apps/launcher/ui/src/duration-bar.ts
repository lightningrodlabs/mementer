import { html } from 'lit'
import { component } from 'haunted';
import 'lit-flatpickr'
import './settings-modal'

const colors = { gold: '#f4c200', goldGrey: '#e1d7b0' }

function DurationBar(props: { startDate: string; endDate: string }) {
    const { startDate, endDate } = props

    function percentage() {
        if (startDate && endDate) {
          const startTime = new Date(startDate).getTime()
          const endTime = new Date(endDate).getTime()
          const now = new Date().getTime()
          if (startTime > now) return 0
          if (endTime < now) return 100
          const duration = endTime - startTime
          const elapsedTime = now - startTime
          return (100 / duration) * elapsedTime
        }
        return 0
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
            .wrapper {
                position: relative;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .duration-header {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                position: relative;
            }
            .gold-svg {
                width: 70px;
                height: 70px;
                filter: invert(50%) sepia(100%) saturate(1000%) hue-rotate(18deg) brightness(120%);
            }
            .bar {
                width: calc(100% - 105px);
                height: 25px;
                background-color: ${colors.goldGrey};
                position: absolute;
                left: 42px;
            }
            .elapsed-time {
                height: 25px;
                background-color: ${colors.gold};
            }
            .elapsed-percentage {
                width: 20px;
                position: absolute;
                left: calc(50% - 10px);
                top: 3px;
            }
        </style>
        <div class='wrapper'>
            <div class='bar'>
                <div class='elapsed-time' style='width: calc(100% * ${percentage() / 100})'></div>
                <p class='elapsed-percentage'>${percentage().toFixed(2)}%</p>
            </div>
            <img class='gold-svg' src='https://www.svgrepo.com/show/161947/letter-a-text-variant.svg' alt='alpha' />
            <img class='gold-svg' src='https://upload.wikimedia.org/wikipedia/commons/3/3d/Code2000_Greek_omega.svg' alt='omega' />
        </div>
    `
}

customElements.define('duration-bar', component(DurationBar as any))
