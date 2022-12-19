import { html, LitElement } from 'lit';
import { component, useState, useRef, useEffect } from 'haunted';
import { AdminWebsocket, AppWebsocket, InstalledCell } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import * as d3 from 'd3';
import 'lit-flatpickr';

type sizes = 'small' | 'medium' | 'large'
type focusStates = 'default' | 'small' | 'medium' | 'large'

const svgSize = 700
const circleSize = 500
const sizesArray: sizes[] = ['large', 'medium', 'small']
const colors = {
  grey1: '#888',
  grey2: '#bbb',
  grey3: '#ccc',
  grey4: '#ddd',
  blue1: '#0068e8',
  blue2: '#4e92e6',
  blue3: '#84aee3',
  green1: '#a8ed64',
  green2: '#8cd446',
  buttonBlue: '#8bc8ff',
  buttonRed: '#ff8b8b'
}
const circleColors = {
    large: colors.grey2,
    medium: colors.grey3,
    small: colors.grey4
}
const timerColors = {
    large: colors.blue1,
    medium: colors.blue2,
    small: colors.blue3
}
const focusStateScales = {
    default: { large: 1, medium: 0.75, small: 0.5 },
    large: { large: 1, medium: 0.2, small: 0.1 },
    medium: { large: 1, medium: 0.9, small: 0.1 },
    small: { large: 1, medium: 0.9, small: 0.8 },
}

function Mementer(props: { shadowRoot: any }) {
    const { shadowRoot } = props
    const [loading, setLoading] = useState(true);
    const [totalDuration, setTotalDuration] = useState(6000)
    const [numberOfSlices] = useState({ large: 24, medium: 12, small: 6 })
    const [circleDurations, setCircleDurations] = useState({
      large: totalDuration,
      medium: totalDuration / numberOfSlices.large,
      small: totalDuration / numberOfSlices.large / numberOfSlices.medium
    })
    const [timerActive, setTimerActive] = useState(false)
    const [largeActiveSlice, setLargeActiveSlice] = useState(0)
    const [mediumActiveSlice, setMediumActiveSlice] = useState(0)
    const [smallActiveSlice, setSmallActiveSlice] = useState(0)
    const [sliceData] = useState<any>({ large: [], medium: [], small: [] })
    const [newSliceText, setNewSliceText] = useState('')
    const [startDate, setStartDate] = useState('∞')
    const [endDate, setEndDate] = useState('∞')

    const focusStateRef = useRef<focusStates>('default')
    const selectedSlicesRef = useRef<any>({ large: 0, medium: 0, small: 0 })
    const timerRefs = useRef<any>({})

    async function connectToHolochain() {
        const url = `ws://localhost:${process.env.HC_PORT}`
        const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`)
        const appWebsocket = await AppWebsocket.connect(url)
        const client = new HolochainClient(appWebsocket)
        const appInfo = await appWebsocket.appInfo({ installed_app_id: 'mementer' })
        const installedCells = appInfo.cell_data
        const mementerCell = installedCells.find(c => c.role_id === 'mementer') as InstalledCell
        const cellClient = new CellClient(client, mementerCell)
        setLoading(false)
    }

    function findArc(size: sizes, start: number, end: number) {
        const outerRadius = focusStateScales[focusStateRef.current][size] * circleSize / 2
        const slice = Math.PI * 2 / numberOfSlices[size]
        return d3.arc().outerRadius(outerRadius).innerRadius(0).startAngle(start * slice).endAngle(end * slice)
    }

    function fadeOutSelectedSlices() {
      sizesArray.forEach((size) => {
        if (selectedSlicesRef.current[size]) {
          const path = shadowRoot?.getElementById(`${size}-arc-${selectedSlicesRef.current[size]}`)
          d3.select(path).transition('fill').duration(300).style('fill', circleColors[size])
        }
      })
    }

    function fadeInSelectedSlices() {
      sizesArray.forEach((size) => {
        if (selectedSlicesRef.current[size]) {
          const path = shadowRoot?.getElementById(`${size}-arc-${selectedSlicesRef.current[size]}`)
          d3.select(path).transition('fill').duration(300).style('fill', colors.grey1)
        }
      })
    }

    function findNewSelectedSlices(size: sizes, index: number) {
      const newSelectedSlices = { ...selectedSlicesRef.current }
      if (size === 'large') {
        newSelectedSlices.large = index
        const changed = selectedSlicesRef.current.large !== index
        if (changed) {
          newSelectedSlices.medium = 0
          newSelectedSlices.small = 0
        }
      }
      if (size === 'medium') {
        newSelectedSlices.large = selectedSlicesRef.current.large || 1
        newSelectedSlices.medium = index
        const changed = selectedSlicesRef.current.medium !== index
        if (changed) {
          newSelectedSlices.small = 0
        }
      }
      if (size === 'small') {
        newSelectedSlices.large = selectedSlicesRef.current.large || 1
        newSelectedSlices.medium = selectedSlicesRef.current.medium || 1
        newSelectedSlices.small = index
      }
      selectedSlicesRef.current = newSelectedSlices
    }
  
    function createSlices(size: sizes) {
        const group = d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
        // remove old slices
        group.selectAll('path').remove()
        // create new slices
        for (let i = 0; i < numberOfSlices[size]; i += 1) {
          const arc = findArc(size, i, i + 1)
          group
            .append('path')
            .attr('id', `${size}-arc-${i + 1}`)
            .classed('arc', true)
            .attr('d', <any>arc)
            .style('fill', circleColors[size])
            .style('stroke', 'black')
            .on('mouseover', function (this: any) {
              d3.select(this).transition('fill').duration(300).style('fill', colors.grey1)
            })
            .on('mouseout', function (this: any) {
              const selected = selectedSlicesRef.current[size] === i + 1
              if (!selected) d3.select(this).transition('fill').duration(300).style('fill', circleColors[size])
            })
            .on('mousedown', () => {
              fadeOutSelectedSlices()
              findNewSelectedSlices(size, i + 1)
              fadeInSelectedSlices()
            })
          // create slice data
          sliceData[size][i] = ''
        }
    }
  
    function transitionCircleSize(size: sizes) {
      // transition circle slices
      const group = shadowRoot?.getElementById(`${size}-circle-group`)
      d3.select(group!).selectAll('.arc').each(function (this: any, d, i: number) {
        d3.select(this).transition().duration(1000).attr('d', <any>findArc(size, i, i + 1))
      })
      // transition timer
      const timer = shadowRoot?.getElementById(`${size}-timer`)
      d3.select(timer!).transition('size').duration(1000).attr('transform', `scale(${focusStateScales[focusStateRef.current][size] / 2})`)
    }
  
    function updateFocusState(focus: focusStates) {
        focusStateRef.current = focus
        sizesArray.forEach((size: sizes) => transitionCircleSize(size))
        if (focus === 'default') {
          fadeOutSelectedSlices()
          selectedSlicesRef.current = { large: 0, medium: 0, small: 0 }
        }
    }
  
    function createCircle(svg: any, size: sizes) {
        // create circle group
        svg
          .append('g')
          .attr('id', `${size}-circle-group`)
          .attr('transform', `translate(${svgSize / 2}, ${svgSize / 2})`)
          .style('cursor', 'pointer')
          .on('mousedown', () => updateFocusState(size))
        // create slices
        createSlices(size)
    }

    function setActiveSlice(size: sizes, slice: number) {
      if (size === 'large') setLargeActiveSlice(slice)
      if (size === 'medium') setMediumActiveSlice(slice)
      if (size === 'small') setSmallActiveSlice(slice)
    }
  
    function createTimer(size: sizes, circleGroup?: any) {
        const group = circleGroup || d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
        const arc = d3.arc().outerRadius(circleSize).innerRadius(0)
        // set up interval timer
        const circleDuration = circleDurations[size] * 1000
        let sliceIndex = 1
        setActiveSlice(size, sliceIndex)
        timerRefs.current[size] = setInterval(() => {
          sliceIndex += 1
          if (sliceIndex <= numberOfSlices[size]) setActiveSlice(size, sliceIndex)
          else clearInterval(timerRefs.current[size])
        }, circleDuration / numberOfSlices[size])
        // remove old path
        group.select(`#${size}-timer`).remove()
        // create new path
        group
            .append('path')
            .attr('id', `${size}-timer`)
            .datum({ startAngle: 0, endAngle: Math.PI * 2 })
            .attr('d', <any>arc)
            .attr('pointer-events', 'none')
            .attr('transform', `scale(${focusStateScales[focusStateRef.current][size] / 2})`)
            .style('opacity', 0.5)
            .style('fill', timerColors[size])
            .transition('time')
            .ease(d3.easeLinear)
            .duration(circleDuration)
            .attrTween('d', (d: any) => {
              const interpolate = d3.interpolate(0, d.endAngle)
              return (t: number) => {
                d.endAngle = interpolate(t)
                return <any>arc(d)
              }
            })
            .on('end', () => createTimer(size, group))
    }
  
    function startTimer() {
        setTimerActive(true)
        sizesArray.forEach((size: sizes) => createTimer(size))
    }
  
    function stopTimer() {
        setTimerActive(false)
        sizesArray.forEach((size: sizes) => {
          d3.select(shadowRoot?.getElementById(`${size}-timer`)!).interrupt('time').remove()
          clearInterval(timerRefs.current[size])
        })
    }
  
    function findCircleDurationText(size: sizes) {
        return `(${+circleDurations[size].toFixed(2)}s / ${+(circleDurations[size] / numberOfSlices[size]).toFixed(2)}s)`
    }
  
    function updateCircleDurations() {
        setCircleDurations({
          small: totalDuration / numberOfSlices.large / numberOfSlices.medium,
          medium: totalDuration / numberOfSlices.large,
          large: totalDuration
        })
    }
  
    function updateSlices(size: sizes, slices: number) {
        stopTimer()
        numberOfSlices[size] = slices < 1 ? 1 : slices
        updateCircleDurations()
        createSlices(size)
    }
  
    function updateTotalDuration(seconds: number) {
        stopTimer()
        setTotalDuration(seconds < 1 ? 1 : seconds)
        updateCircleDurations()
    }
  
    function saveSliceText() {
      if (timerActive) {
        // save to active slice
        sliceData[largeActiveSlice][mediumActiveSlice][smallActiveSlice] = newSliceText
      } else {
        // todo: add to selected slice
      }
    }

    function changeDate(position: 'start' | 'end') {
      const date = shadowRoot.querySelector(`#${position}-date`).getValue()
      if (position === 'start') setStartDate(date)
      else setEndDate(date)
    }

    function openDatePicker(position: 'start' | 'end') {
      shadowRoot!.getElementById(`${position}-date`).open()
    }

    function findTotalDurationText() {
      return totalDuration ? `Total duration: ${totalDuration}` : '∞'
    }

    useEffect(() => connectToHolochain(), [])

    useEffect(() => {
        if (!loading) {
          // create svg
          const shadowCanvas = shadowRoot!.getElementById('canvas')
          const svg = d3.select(shadowCanvas).append('svg').attr('width', svgSize).attr('height', svgSize)
          // create background
          svg
              .append('rect')
              .attr('id', 'background')
              .attr('width', svgSize)
              .attr('height', svgSize)
              .attr('fill', 'white')
              .style('cursor', 'pointer')
              .on('mousedown', () => updateFocusState('default'))
          // create circle layers
          sizesArray.forEach((size: sizes) => createCircle(svg, size))
        }

    }, [loading])

    if (loading) return html`
        <div class="row" style="flex: 1; height: 100%; align-items: center; justify-content: center;">
            Loading...
        </div>
    `
    return html`
      <style></style>
      <div style="display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center;">
        <h1>The Mementer: The Chronogram of Life</h1>

        <div style="width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <div style="display: flex; flex-direction: column; align-items: center; position: relative">
            <img src='https://upload.wikimedia.org/wikipedia/commons/5/54/Letter_A.svg' alt='alpha' style="width: 25px; height: 25px; margin-bottom: 10px" />
            <lit-flatpickr
              id="start-date"
              altFormat="F j, Y"
              dateFormat="Y-m-d"
              theme="material_orange"
              style="background: none"
              .onChange="${() => changeDate('start')}"
            >
              <div>
                <input style="width: 20px; height: 50px; visibility: hidden" />
              </div>
            </lit-flatpickr>
            <p style="margin: 0; position: absolute; top: 35px;">${startDate}</p>
            <button @click=${() => openDatePicker('start')} style="position: absolute; width: 100px; top: 70px;">
              Add start date
            </button>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center">
            <p>Duration</p>
            <p style="margin: 0">${findTotalDurationText()}</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; position: relative">
            <img src='https://upload.wikimedia.org/wikipedia/commons/3/3d/Code2000_Greek_omega.svg' alt='omega' style="width: 20px; height: 20px; margin-bottom: 10px" />
            <lit-flatpickr
              id="end-date"
              altFormat="F j, Y"
              dateFormat="Y-m-d"
              theme="material_orange"
              style="background: none"
              .onChange="${() => changeDate('end')}"
            >
              <div>
                <input style="width: 20px; height: 50px; visibility: hidden" />
              </div>
            </lit-flatpickr>
            <p style="margin: 0; position: absolute; top: 35px;">${endDate}</p>
            <button @click=${() => openDatePicker('end')} style="position: absolute; width: 100px; top: 70px;">
              Add end date
            </button>
          </div>
        </div>

        <button
          style="all: unset; background-color: ${timerActive ? colors.buttonRed : colors.buttonBlue}; padding: 10px; border-radius: 5px; cursor: pointer; margin-bottom: 20px"
          @click=${timerActive ? stopTimer : startTimer}
        >
          ${timerActive ? 'Stop' : 'Start'} timer
        </button>

        <div style="display: flex; margin-bottom: 20px">
          <p style="margin-right: 20px">large slice: ${largeActiveSlice}</p>
          <p style="margin-right: 20px">medium slice: ${mediumActiveSlice}</p>
          <p>small slice: ${smallActiveSlice}</p>
        </div>
        
        <div style='display: flex; align-items: center'>
          <div style='margin-bottom: 20px' id='canvas'></div>

          <div style='width: 300px; height: 100%; display: flex; flex-direction: column; align-items: center; margin-left: 40px'>
            <p id='selected-slice-details' style='margin: 0 0 20px 0'>No slice selected</p>
            <div id='selected-slice-input-wrapper' style='display: none; flex-direction: column; align-items: center'>
              <textarea
                id='selected-slice-input'
                rows='14'
                .value=${newSliceText}
                @keyup=${(e: any) => setNewSliceText(e.target.value)}
                @change=${(e: any) => setNewSliceText(e.target.value)}
                style='all: unset; width: 280px; border: 2px solid ${colors.grey1}; border-radius: 20px; background-color: white; padding: 20px; white-space: pre-wrap'
              ></textarea>
              <button
                @click=${() => saveSliceText()}
                style="all: unset; background-color: #8bc8ff; padding: 10px; border-radius: 5px; cursor: pointer; margin-top: 20px; width: 80px"
              >
                Save text
              </button>
            </div>
          </div>
        </div>
        
      </div>
    `
}

customElements.define('the-mementer', component(Mementer));

export class MementerApp extends ScopedElementsMixin(LitElement) {  
    render() {
        return html`<the-mementer shadowRoot=${this.shadowRoot}></the-mementer>`
    }

    static get scopedElements() { return {} }
}

// <div style="display: flex; align-items: center; margin-bottom: 20px">
// <p style="margin: 0">Total duration (seconds)</p>
// <input
//   type='number'
//   min='1'
//   .value=${totalDuration}
//   @keyup=${(e: any) => updateTotalDuration(+e.target.value)}
//   @change=${(e: any) => updateTotalDuration(+e.target.value)}
//   style="width: 100px; height: 30px; margin-left: 10px"
// >
// </div>

// <div style="display: flex; margin-bottom: 20px; width: 1200px;">
// <div style="display: flex; align-items: center; width: 400px">
//   <p style="margin: 0 10px 0 0">Large slices</p>
//   <input
//     type='number'
//     min='1'
//     .value=${numberOfSlices.large}
//     @keyup=${(e: any) => updateSlices('large', +e.target.value)}
//     @change=${(e: any) => updateSlices('large', +e.target.value)}
//     style="width: 50px; height: 30px; margin-right: 10px"
//   >
//   <p style="margin: 0">
//     ${findCircleDurationText('large')}
//   </p>
// </div>
// <div style="display: flex; align-items: center; width: 400px">
//   <p style="margin: 0 10px 0 0">Medium slices</p>
//   <input
//     type='number'
//     min='1'
//     .value=${numberOfSlices.medium}
//     @keyup=${(e: any) => updateSlices('medium', +e.target.value)}
//     @change=${(e: any) => updateSlices('medium', +e.target.value)}
//     style="width: 50px; height: 30px; margin-right: 10px"
//   >
//   <p style="margin: 0">
//     ${findCircleDurationText('medium')}
//   </p>
// </div>
// <div style="display: flex; align-items: center; width: 400px">
//   <p style="margin: 0 10px 0 0">Small slices</p>
//   <input
//     type='number'
//     min='1'
//     .value=${numberOfSlices.small}
//     @keyup=${(e: any) => updateSlices('small', +e.target.value)}
//     @change=${(e: any) => updateSlices('small', +e.target.value)}
//     style="width: 50px; height: 30px; margin-right: 10px"
//   >
//   <p style="margin: 0">
//     ${findCircleDurationText('small')}
//   </p>
// </div>
// </div>