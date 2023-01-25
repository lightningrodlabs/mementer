import { html } from 'lit';
import { component, useState } from 'haunted';
import 'lit-flatpickr';
import './duration-bar'

const colors = { blue: '#44b1f7', blueGrey: '#78bdea' }

function SettingsModal(props: { shadowRoot: any; close: () => void; save: (data: any) => void }) {
    const { shadowRoot, close, save } = props
    const modalWidth = 700
    const [title, setTitle] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [duration, setDuration] = useState(0)
    const [durationModalOpen, setDurationModalOpen] = useState(false)
    const [years, setYears] = useState(0)
    const [days, setDays] = useState(0)
    const [largeSlices, setLargeSlices] = useState(24)
    const [mediumSlices, setMediumSlices] = useState(12)
    const [smallSlices, setSmallSlices] = useState(6)

    function pluralise(number: number): string {
        return number < 1 || number > 1 ? 's' : ''
    }

    function formatDate(date: Date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }

    function findDuration(start: string, end: string) {
        return new Date(end).getTime() - new Date(start).getTime()
    }

    function findMaxDate() {
        if (endDate) {
          const maxDate = new Date(endDate)
          maxDate.setDate(maxDate.getDate() - 1)
          return formatDate(maxDate)
        }
        return ''
    }
  
    function findMinDate() {
        if (startDate) {
            const minDate = new Date(startDate)
            minDate.setDate(minDate.getDate() + 1)
            return formatDate(minDate)
        }
        return ''
    }

    function totalYearsAndDays(milliseconds: number) {
        const day = 1000 * 60 * 60 * 24
        const year = day * 365
        const totalYears = Math.floor(milliseconds / year)
        const totalDays = Math.floor(milliseconds / day) - totalYears * 365
        return { totalYears, totalDays }
    }

    function durationText(): string {
        if (duration) {
            const { totalYears, totalDays } = totalYearsAndDays(duration)
            const yearsText = totalYears > 0 ? `${totalYears} year${pluralise(totalYears)}` : ''
            const daysText = totalDays > 0 ? `${totalDays} day${pluralise(totalDays)}` : ''
            return `${yearsText}${totalYears > 0 && totalDays > 0 ? ', ' : ''}${daysText}`
        }
        return '∞'
    }

    function sliceText(size: string) {
        if (startDate && endDate) {
            const largeSliceDuration = duration / largeSlices
            const mediumSliceDuration = largeSliceDuration / mediumSlices
            const smallSliceDuration = mediumSliceDuration / smallSlices
            let sliceDuration = 0
            if (size === 'large') sliceDuration = largeSliceDuration
            if (size === 'medium') sliceDuration = mediumSliceDuration
            if (size === 'small') sliceDuration = smallSliceDuration
            const { totalYears, totalDays } = totalYearsAndDays(sliceDuration)
            if (totalYears || totalDays) {
                const y = totalYears ? `${totalYears} year${pluralise(totalYears)}` : ''
                const d = totalDays ? `${totalDays} day${pluralise(totalDays)}` : ''
                return `(${y}${totalYears && totalDays ? ', ' : ''}${d} / slice)`
            }
            return '(<1 day / slice)'
        }
        return ''
    }

    function openDatePicker(position: 'start' | 'end') {
        shadowRoot!.getElementById(`${position}-date`).open()
    }

    function updateDuration(newDuration: number) {
        setDuration(newDuration)
        const { totalYears, totalDays } = totalYearsAndDays(newDuration)
        setYears(totalYears)
        setDays(totalDays)
    }

    function updateOtherDate(position: 'start' | 'end', knownDate: string, milliseconds: number) {
        const time = position === 'start' ? -milliseconds : milliseconds
        const newDate = formatDate(new Date(new Date(knownDate).getTime() + time))
        if (position === 'start') setStartDate(newDate)
        else setEndDate(newDate)
        shadowRoot!.getElementById(`${position}-date`).setDate(newDate)
    }

    function changeDate(position: 'start' | 'end') {
        const newDate = shadowRoot.querySelector(`#${position}-date`).getValue()
        if (position === 'start') {
            setStartDate(newDate)
            if (endDate) updateDuration(findDuration(newDate, endDate))
            else if (duration) updateOtherDate('end', newDate, duration)
        } else {
            setEndDate(newDate)
            if (startDate) updateDuration(findDuration(startDate, newDate))
            else if (duration) updateOtherDate('start', newDate, duration)
        }
    }

    function changeDuration() {
        const day = 1000 * 60 * 60 * 24
        const year = day * 365
        const newDuration = years * year + days * day
        setDuration(newDuration)
        if (startDate) updateOtherDate('end', startDate, newDuration)
        else if (endDate) updateOtherDate('start', endDate, newDuration)
        setDurationModalOpen(false)
    }

    return html`
        <style>
            * {
                -webkit-box-sizing: border-box;
                -moz-box-sizing: border-box;
            }
            p, h2, h3 {
                margin: 0;
            }
            .modal {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: absolute;
                top: 200px;
                width: ${modalWidth}px;
                left: calc(50% - ${modalWidth / 2}px);
                background: white;
                border-radius: 10px;
                padding: 50px;
                box-shadow: 0 0 15px 0 rgba(0,0,0, 0.15);
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
            .button {
                all: unset;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: ${colors.blue};
                height: 40px;
                border-radius: 20px;
                padding: 0 20px;
                color: white;
            }
            .button:disabled {
                background-color: ${colors.blueGrey};
                cursor: default;
            }
            .column {
                display: flex;
                flex-direction: column;
            }
            .row {
                display: flex;
                align-items: center;
            }
            .text-input {
                width: 300px;
                height: 40px;
                font-size: 16px;
                padding: 0 10px;
            }
            .number-input {
                width: 50px;
                height: 30px;
            }
            .duration {
                width: 100%;
                display: flex;
                flex-direction: column;
                margin-bottom: 50px;
            }
            .duration-picker {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .duration-modal {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: absolute;
                top: 370px;
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 0 15px 0 rgba(0,0,0, 0.15);
                width: 300px;
                z-index: 10;
            }
            .slices {
                display: flex;
                width: 100%;
                justify-content: space-between;
                margin-bottom: 50px;
            }
            .slice-item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .slice-input {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            .slice-input > p {
                margin-right: 10px;
            }
        </style>
        <div class='modal'>
            <button class="close-button" @click=${close}>X</button>
            <h2 style='margin-bottom: 50px'>Create a new Mementer</h2>

            <div class='row' style='margin-bottom: 30px'>
                <p style='margin-right: 15px'>Title:</p>
                <input
                    class='text-input'
                    type='text'
                    .value=${title}
                    @keyup=${(e: any) => setTitle(e.target.value)}
                    @change=${(e: any) => setTitle(e.target.value)}
                >
            </div>

            <div class='duration'>
                <duration-bar .startDate=${startDate} .endDate=${endDate} style='margin-bottom: 20px'></duration-bar>
                <div class='duration-picker'>
                    <div style='display: flex; flex-direction: column'>
                        <p style="margin-bottom: 15px">${startDate || '∞'}</p>
                        <div style="position: relative">
                            <lit-flatpickr
                                id="start-date"
                                maxDate="${findMaxDate()}"
                                altFormat="F j, Y"
                                dateFormat="Y-m-d"
                                theme="material_orange"
                                style="background: none; position: absolute;"
                                .onChange="${() => changeDate('start')}"
                            >
                                <div>
                                    <input style="width: 20px; height: 50px; visibility: hidden" />
                                </div>
                            </lit-flatpickr>
                            <button class="button" @click=${() => openDatePicker('start')}>
                                ${startDate ? 'Change' : 'Add'} start
                            </button>
                        </div>
                    </div>
                    <div style='display: flex; flex-direction: column; align-items: center'>
                        <p style="margin-bottom: 15px">${durationText()}</p>
                        <button @click=${() => setDurationModalOpen(true)} class="button">
                            ${duration ? 'Change' : 'Add'} duration
                        </button>
                        ${durationModalOpen
                            ? html`
                                <div class="duration-modal">
                                    <button class="close-button" @click=${() => setDurationModalOpen(false)}>X</button>
                                    <h3 style='margin-bottom: 30px'>Duration modal</h3>
                                    <div style="display: flex; align-items: center; margin-bottom: 20px">
                                        <p>Years</p>
                                        <input
                                            type='number'
                                            min='0'
                                            .value=${years}
                                            @keyup=${(e: any) => setYears(+e.target.value)}
                                            @change=${(e: any) => setYears(+e.target.value)}
                                            style="width: 100px; height: 30px; margin-left: 10px"
                                        >
                                    </div>
                                    <div style="display: flex; align-items: center; margin-bottom: 30px">
                                        <p>Days</p>
                                        <input
                                            type='number'
                                            min='0'
                                            .value=${days}
                                            @keyup=${(e: any) => setDays(+e.target.value)}
                                            @change=${(e: any) => setDays(+e.target.value)}
                                            style="width: 100px; height: 30px; margin-left: 10px"
                                        >
                                    </div>
                                    <button @click=${changeDuration} class="button">
                                        Save duration
                                    </button>
                                </div>
                            `
                        : ''
                        }
                    </div>
                    <div style='display: flex; flex-direction: column; align-items: end'>
                        <p style="margin-bottom: 15px">${endDate || '∞'}</p>
                        <div style="position: relative">
                        <lit-flatpickr
                            id="end-date"
                            minDate="${findMinDate()}"
                            altFormat="F j, Y"
                            dateFormat="Y-m-d"
                            theme="material_orange"
                            style="background: none; position: absolute;"
                            .onChange="${() => changeDate('end')}"
                        >
                            <div>
                            <input style="width: 20px; height: 50px; visibility: hidden" />
                            </div>
                        </lit-flatpickr>
                        <button @click=${() => openDatePicker('end')} class="button">
                            ${endDate ? 'Change' : 'Add'} end
                        </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class='slices'>
                <div class='slice-item'>
                    <div class='slice-input'>
                        <p>Large slices</p>
                        <input
                            class='number-input'
                            type='number'
                            min='1'
                            .value=${largeSlices}
                            @keyup=${(e: any) => setLargeSlices(+e.target.value)}
                            @change=${(e: any) => setLargeSlices(+e.target.value)}
                        >
                    </div>
                    <p>${sliceText('large')}</p>
                </div>
                <div class='slice-item'>
                    <div class='slice-input'>
                        <p>Medium slices</p>
                        <input
                            class='number-input'
                            type='number'
                            min='1'
                            .value=${mediumSlices}
                            @keyup=${(e: any) => setMediumSlices(+e.target.value)}
                            @change=${(e: any) => setMediumSlices(+e.target.value)}
                        >
                    </div>
                    <p>${sliceText('medium')}</p>
                </div>
                <div class='slice-item'>
                    <div class='slice-input'>
                        <p>Small slices</p>
                        <input
                            class='number-input'
                            type='number'
                            min='1'
                            .value=${smallSlices}
                            @keyup=${(e: any) => setSmallSlices(+e.target.value)}
                            @change=${(e: any) => setSmallSlices(+e.target.value)}
                        >
                    </div>
                    <p>${sliceText('small')}</p>
                </div>
            </div>
            
            <button
                class="button"
                .disabled=${!title || !(startDate && endDate)}
                @click=${() => save({ title, startDate, endDate, largeSlices, mediumSlices, smallSlices })}
            >
                Create
            </button>
        </div>
    `
}

customElements.define('settings-modal', component(SettingsModal as any))
