/* eslint-disable no-nested-ternary */
/* eslint-disable no-use-before-define */
import { html } from 'lit'
import { component, useState, useRef, useEffect } from 'haunted'
import { serializeHash, deserializeHash } from '@holochain-open-dev/utils'
import * as d3 from 'd3'
import 'lit-flatpickr'
import { findDuration, formatDate } from './helpers'
import './settings-modal'
import './duration-bar'
import './nav-link'

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
  buttonRed: '#ff8b8b',
  gold: '#f4c200',
  greyGold: '#e1d7b0'
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

function Mementer(props: { shadowRoot: any; mementerService: any; route: string; entryHash: string | undefined }) {
    const { shadowRoot, mementerService, route, entryHash } = props
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<any>(null)
    const [selectedBeads, setSelectedBeads] = useState<any[]>([])
    const [newBeadText, setNewBeadText] = useState('')
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const beads = useRef<any[]>([])
    const focusState = useRef<focusStates>('default')
    const selectedSlices = useRef<any>({ large: 0, medium: 0, small: 0 })

    function findArc(size: sizes, start: number, end: number) {
      const totalSlices = settings[`${size}Slices`]
      const outerRadius = focusStateScales[focusState.current][size] * circleSize / 2
      const slice = Math.PI * 2 / totalSlices
      return d3.arc().outerRadius(outerRadius).innerRadius(0).startAngle(start * slice).endAngle(end * slice)
    }

    function createStaticTimer(size: sizes) {
      const group = d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
      const arc = d3.arc().outerRadius(circleSize).innerRadius(0)
      group.select(`#${size}-timer`).remove()
      group
        .append('path')
        .attr('id', `${size}-timer`)
        .datum({ startAngle: 0, endAngle: Math.PI * 2 })
        .attr('d', <any>arc)
        .attr('pointer-events', 'none')
        .attr('transform', `scale(${focusStateScales[focusState.current][size] / 2})`)
        .style('opacity', 0.5)
        .style('fill', timerColors[size])
    }

    function removeTimer(size: sizes) {
      const group = d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
      group.select(`#${size}-timer`).remove()
    }

    function fadeOutSelectedSlices() {
      sizesArray.forEach((size) => {
        if (selectedSlices.current[size]) {
          const path = d3.select(shadowRoot?.getElementById(`${size}-arc-${selectedSlices.current[size]}`))
          if (path.classed('has-content')) path.transition('fill').duration(300).style('fill', colors.green1)
          else path.transition('fill').duration(300).style('fill', circleColors[size])
        }
      })
    }

    function fadeInSelectedSlices() {
      sizesArray.forEach((size) => {
        if (selectedSlices.current[size]) {
          const path = d3.select(shadowRoot?.getElementById(`${size}-arc-${selectedSlices.current[size]}`))
          if (path.classed('has-content')) path.transition('fill').duration(300).style('fill', colors.green2)
          else path.transition('fill').duration(300).style('fill', colors.grey1)
        }
      })
    }

    // todo: clean up long lines
    function selectSlice(size: sizes, index: number) {
      const { startDate, endDate } = settings
      const { large, medium, small } = findCircleDurations(startDate, endDate)
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      const now = new Date().getTime()
      const timeSinceStart = now - new Date(start).getTime()
      const finished = new Date(end).getTime() < now
      const notStarted = new Date(start).getTime() > now
      const currentLargeSlice = finished || notStarted ? 1 : Math.floor(timeSinceStart / large.slice) + 1
      const largeSliceOffset = (currentLargeSlice - 1) * large.slice
      const currentMediumSlice = finished || notStarted ? 1 : Math.floor((timeSinceStart - largeSliceOffset) / medium.slice) + 1
      const newSelectedSlices = { ...selectedSlices.current }

      if (size === 'large') {
        // update selected slices
        newSelectedSlices.large = index
        newSelectedSlices.medium = 0
        newSelectedSlices.small = 0
        selectedSlices.current = newSelectedSlices
        // update inner slices with beads
        createSlices('medium')
        createSlices('small')
        // update timers
        if (start && end) {
          if (finished || index < currentLargeSlice) {
            createStaticTimer('medium')
            createStaticTimer('small')
          } else if (notStarted || index > currentLargeSlice) {
            removeTimer('medium')
            removeTimer('small')
          } else startTimers()
        }
      }

      if (size === 'medium') {
        // update selected slices
        newSelectedSlices.large = selectedSlices.current.large || currentLargeSlice || 1
        newSelectedSlices.medium = index
        newSelectedSlices.small = 0
        selectedSlices.current = newSelectedSlices
        // update inner slices with beads
        createSlices('small')
        // update timers
        const beforeLargeSlice = newSelectedSlices.large < currentLargeSlice
        const afterLargeSlice = newSelectedSlices.large > currentLargeSlice
        if (start && end) {
          if (finished || beforeLargeSlice || (index < currentMediumSlice && !afterLargeSlice)) createStaticTimer('small')
          else if (notStarted || afterLargeSlice || index > currentMediumSlice) removeTimer('small')
          else startTimers()
        }
      }

      if (size === 'small') {
        // update selected slices
        newSelectedSlices.large = selectedSlices.current.large || currentLargeSlice || 1
        const outsideCurrentLargeSlice = newSelectedSlices.large !== currentLargeSlice
        newSelectedSlices.medium = outsideCurrentLargeSlice && !selectedSlices.current.medium ? 1 : selectedSlices.current.medium || currentMediumSlice || 1
        newSelectedSlices.small = index
        selectedSlices.current = newSelectedSlices
      }

      // find selected beads
      const selectedSliceStart = start + ((newSelectedSlices.large ? newSelectedSlices.large - 1 : 0) * large.slice) + ((newSelectedSlices.medium ? newSelectedSlices.medium - 1 : 0) * medium.slice) + ((newSelectedSlices.small ? newSelectedSlices.small - 1 : 0) * small.slice)
      const length = newSelectedSlices.small ? small.slice : newSelectedSlices.medium ? medium.slice : large.slice
      const selectedSliceEnd = selectedSliceStart + length
      setSelectedBeads(beads.current.filter((bead) => {
        const beadTime = new Date(bead.timeStamp).getTime()
        return beadTime >= selectedSliceStart && beadTime < selectedSliceEnd
      }))
    }

    function sliceHasContent(size: sizes, index: number) {
      // calculate slice time range
      let sliceStart = 0
      let sliceEnd = 0
      const { startDate, endDate } = settings
      const { large, medium, small } = findCircleDurations(startDate, endDate)
      const startTime = new Date(startDate).getTime()
      const largeOffset = (selectedSlices.current.large ? selectedSlices.current.large - 1 : 0) * large.slice
      const mediumOffset = (selectedSlices.current.medium ? selectedSlices.current.medium - 1 : 0) * medium.slice
      if (size === 'large') {
        sliceStart = startTime + (large.slice * index)
        sliceEnd = sliceStart + large.slice
      }
      if (size === 'medium') {
        sliceStart = startTime + largeOffset + (medium.slice * index)
        sliceEnd = sliceStart + medium.slice
      }
      if (size === 'small') {
        sliceStart = startTime + largeOffset + mediumOffset + (small.slice * index)
        sliceEnd = sliceStart + small.slice
      }
      // search for beads within slice time range
      const match = beads.current.find((bead) => {
        const beadTime = new Date(bead.timeStamp).getTime()
        return beadTime >= sliceStart && beadTime < sliceEnd
      })
      return !!match
    }
  
    function createSlices(size: sizes) {
      const group = d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
      // remove old slices
      group.selectAll('path').remove()
      // create new slices
      const totalSlices = settings[`${size}Slices`]
      for (let i = 0; i < totalSlices; i += 1) {
        const arc = findArc(size, i, i + 1)
        const hasContent = sliceHasContent(size, i)
        group
          .append('path')
          .attr('id', `${size}-arc-${i + 1}`)
          .classed('arc', true)
          .classed('has-content', hasContent)
          .attr('d', <any>arc)
          .style('fill', hasContent ? colors.green1 : circleColors[size])
          .style('stroke', 'black')
          .on('mouseover', function (this: any) {
            const path = d3.select(this)
            if (path.classed('has-content')) path.transition('fill').duration(300).style('fill', colors.green2)
            else path.transition('fill').duration(300).style('fill', colors.grey1)
          })
          .on('mouseout', function (this: any) {
            const path = d3.select(this)
            const selected = selectedSlices.current[size] === i + 1
            if (!selected) {
              if (path.classed('has-content')) path.transition('fill').duration(300).style('fill', colors.green1)
              else path.transition('fill').duration(300).style('fill', circleColors[size])
            }
          })
          .on('mousedown', () => {
            fadeOutSelectedSlices()
            selectSlice(size, i + 1)
            fadeInSelectedSlices()
          })
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
      d3.select(timer!).transition('size').duration(1000).attr('transform', `scale(${focusStateScales[focusState.current][size] / 2})`)
    }
  
    function updateFocusState(focus: focusStates) {
      focusState.current = focus
      sizesArray.forEach((size: sizes) => transitionCircleSize(size))
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

    function findSlicesFromDate(date: Date) {
      const { startDate, endDate } = settings
      const { large, medium, small } = findCircleDurations(startDate, endDate)
      const startTime = new Date(startDate).getTime()
      const beadTime = new Date(date).getTime()
      const timeSinceStart = beadTime - startTime
      const largeSlice = Math.floor(timeSinceStart / large.slice) + 1
      const largeSliceOffset = (largeSlice - 1) * large.slice
      const mediumSlice = Math.floor((timeSinceStart - largeSliceOffset) / medium.slice) + 1
      const mediumSliceOffset = largeSliceOffset + ((mediumSlice - 1) * medium.slice)
      const smallSlice = Math.floor((timeSinceStart - mediumSliceOffset) / small.slice) + 1
      return { large: largeSlice, medium: mediumSlice, small: smallSlice }
    }

    function beadSlicesText(date: Date) {
      const { large, medium, small } = findSlicesFromDate(date)
      return `L${large}-M${medium}-S${small}`
    }
  
    function createTimer(size: sizes, circleDuration: number, offset: number, circleGroup?: any) {
        const group = circleGroup || d3.select(shadowRoot?.getElementById(`${size}-circle-group`)!)
        const arc = d3.arc().outerRadius(circleSize).innerRadius(0)
        // calculate current angle
        const offsetPercentage = (100 / circleDuration) * offset
        const currentAngle = offset ? Math.PI * 2 * offsetPercentage / 100 : 0
        // remove old path
        group.select(`#${size}-timer`).remove()
        // create new path
        group
          .append('path')
          .attr('id', `${size}-timer`)
          .datum({ startAngle: 0, endAngle: currentAngle })
          .attr('d', <any>arc)
          .attr('pointer-events', 'none')
          .attr('transform', `scale(${focusStateScales[focusState.current][size] / 2})`)
          .style('opacity', 0.5)
          .style('fill', timerColors[size])
          .transition('time')
          .ease(d3.easeLinear)
          .duration(circleDuration - offset)
          .attrTween('d', (d: any) => {
            const interpolate = d3.interpolate(currentAngle, Math.PI * 2)
            return (t: number) => {
              d.endAngle = interpolate(t)
              return <any>arc(d)
            }
          })
          .on('end', () => createTimer(size, circleDuration, 0, group))
    }

    function findCircleDurations(start: string, end: string) {
      const { largeSlices, mediumSlices, smallSlices } = settings
      const duration = findDuration(start, end)
      const largeCircleDuration = duration
      const mediumCircleDuration = duration / largeSlices
      const smallCircleDuration = mediumCircleDuration / mediumSlices
      return {
        large: {
          circle: largeCircleDuration,
          slice: largeCircleDuration / largeSlices
        },
        medium: {
          circle: mediumCircleDuration,
          slice: mediumCircleDuration / mediumSlices
        },
        small: {
          circle: smallCircleDuration,
          slice: smallCircleDuration / smallSlices
        }
      }
    }

    function startTimers() {
      const { startDate, endDate } = settings
      const { large, medium, small } = findCircleDurations(startDate, endDate)
      // calculate slice offsets and start timers
      const now = new Date().getTime()
      const notStarted = new Date(startDate).getTime() > now
      const finished = new Date(endDate).getTime() < now
      if (notStarted) sizesArray.forEach((size) => removeTimer(size))
      else if (finished) sizesArray.forEach((size) => createStaticTimer(size))
      else {
        const largeOffset = now - new Date(startDate).getTime()
        createTimer('large', large.circle, largeOffset)
        const largeSlicesFinished = Math.floor(largeOffset / large.slice)
        const mediumOffset = largeOffset - (largeSlicesFinished * large.slice)
        createTimer('medium', medium.circle, mediumOffset)
        const mediumSlicesFinished = Math.floor(mediumOffset / medium.slice)
        const smallOffset = mediumOffset - (mediumSlicesFinished * medium.slice)
        createTimer('small', small.circle, smallOffset)
      }
    }
  
    function saveNewBead() {
      const { large, medium, small } = selectedSlices.current
      const selectedSlice = large || medium || small
      let timeStamp = new Date().toString()
      if (selectedSlice) {
        // find start of selected slice
        const { startDate, endDate } = settings
        const circleDurations = findCircleDurations(startDate, endDate)
        const largeDuration = circleDurations.large.slice * (large - 1)
        const mediumDuration = circleDurations.medium.slice * (medium ? medium - 1 : 0)
        const smallDuration = circleDurations.small.slice * (small ? small - 1 : 0)
        const durationFromStartDate = largeDuration + mediumDuration + smallDuration
        timeStamp = new Date(new Date(startDate).getTime() + durationFromStartDate).toString()
      }
      const bead = { text: newBeadText, timeStamp, createdAt: new Date().toString() } as any

      mementerService
        .createBead({ entryHash: deserializeHash(entryHash!), bead })
        .then((res: any) => {
          bead.id = serializeHash(res.entryHash)
          beads.current.push(bead)
          setNewBeadText('')
          if (selectedSlice) setSelectedBeads([...selectedBeads, bead])
          // highlight bead slices
          const highlightedSlices = selectedSlice ? selectedSlices.current : findSlicesFromDate(new Date())
          sizesArray.forEach((size) => {
            const path = shadowRoot?.getElementById(`${size}-arc-${highlightedSlices[size]}`)
            if (path) d3.select(path).classed('has-content', true).transition('fill').duration(300).style('fill', colors.green1)
          })
        })
        .catch((error: any) => console.log('createBead error: ', error))
    }

    function updateMementerSettings(newSettings: any) {
      mementerService
        .updateMementer({ entryHash: deserializeHash(entryHash!), settings: newSettings })
        .then(() => {
          setSettings(newSettings)
          setSettingsModalOpen(false)
        })
        .catch((error: any) => console.log('updateMementer error: ', error))
    }

    // grab mementer and beads from DHT
    useEffect(() => {
      if (entryHash && route === 'mementer') {
        Promise.all([
          mementerService.getMementer(deserializeHash(entryHash)),
          mementerService.getBeads(deserializeHash(entryHash)),
        ])
          .then((data) => {
            setLoading(false)
            beads.current = data[1].map((item: any) => ({ id: serializeHash(item.entryHash), ...item.bead }))
            setSettings(data[0].settings)
          })
          .catch((error) => console.log(error))
      }
      // reset focus state on page change
      if (route === 'home') updateFocusState('default')
    }, [entryHash, route])

    // build mementer with new settings data
    useEffect(() => {
      if (settings) {
        // create svg and background
        const canvas = shadowRoot!.getElementById('canvas')
        d3.select(canvas).selectAll('svg').remove()
        const svg = d3.select(canvas).append('svg').attr('width', svgSize).attr('height', svgSize)
        svg
          .append('rect')
          .attr('id', 'background')
          .attr('width', svgSize)
          .attr('height', svgSize)
          .attr('fill', 'white')
          .attr('stroke', 'black')
          .attr('stroke-width', 3)
          .style('cursor', 'pointer')
          .on('mousedown', () => updateFocusState('default'))
        // reset refs
        focusState.current = 'default'
        selectedSlices.current = findSlicesFromDate(new Date())
        // create circle layers
        sizesArray.forEach((size: sizes) => createCircle(svg, size))
        // start timers
        startTimers()
      }
    }, [settings])

    if (loading) return html`
      <div class='row' style='flex: 1; height: 100%; align-items: center; justify-content: center;'>
        Loading...
      </div>
    `
    return html`
      <style>
        * {
          -webkit-box-sizing: border-box;
          -moz-box-sizing: border-box;
        }
        p, h3 { margin: 0 }
        .button {
          all: unset;
          cursor: pointer;
          background-color: #8bc8ff;
          border-radius: 5px;
          padding: 10px;
        }
        .nav-button {
          all: unset;
          position: fixed;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: ${colors.grey3};
          cursor: pointer;
        }
        .nav-button > img {
          width: 30px;
          height: 30px;
          opacity: 0.8;
        }
        .home-button { top: 20px; left: 20px }
        .settings-button { top: 20px; right: 20px }
        .help-button { bottom: 20px; right: 20px }
        .gold {
          filter: invert(50%) sepia(100%) saturate(1000%) hue-rotate(18deg) brightness(120%);
        }
        .mementer-infinity {
          width: 60px;
          height: 60px;
          position: absolute;
          top: 49px;
          left: 320px;
        }
        .bead-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 340px;
          height: 340px;
          border: 2px solid ${colors.grey1};
          border-radius: 20px;
          background-color: white;
          padding: 20px;
          margin-bottom: 20px;
        }
        .bead-card > p {
          color: ${colors.grey2};
          margin-bottom: 10px;
        }
        .bead-card > textarea {
          all: unset;
          white-space: pre-wrap;
          width: 100%;
        }
        .new-bead-container {
          width: 340px;
          height: 700px;
          margin-right: 50px;
          display: flex;
          align-items: center;
        }
        .selected-beads {
          display: flex;
          flex-direction: column;
          width: 340px;
          height: 700px;
          margin-left: 50px;
          overflow: scroll;
        }
      </style>
      <div style='display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center;'>
        <h1 style='margin-bottom: 50px'>${settings.title}</h1>

        <nav-link href='/' class='nav-button home-button'>
          <img src='https://upload.wikimedia.org/wikipedia/commons/3/34/Home-icon.svg' alt='home' />
        </nav-link>

        <button class='nav-button settings-button' @click=${() => setSettingsModalOpen(true)}>
          <img src='https://upload.wikimedia.org/wikipedia/commons/9/92/Cog_font_awesome.svg' alt='settings' />
        </button>

        <button class='nav-button help-button' @click=${() => setHelpModalOpen(true)}>
          <img src='https://upload.wikimedia.org/wikipedia/commons/f/f8/Question_mark_alternate.svg' alt='help' />
        </button>

        ${settingsModalOpen
          ? html`
              <settings-modal
                shadowRoot=${shadowRoot}
                .location=${'mementer'}
                .settings=${settings}
                .close=${() => setSettingsModalOpen(false)}
                .save=${updateMementerSettings}
              ></settings-modal>
          `
          : ''
        }
        
        <div style='display: flex; width: 1480px'>
          <div class='new-bead-container'>
            <div style='display: flex; flex-direction: column; align-items: center'>
              <div class='bead-card'>
                <textarea
                  rows='14'
                  .value=${newBeadText}
                  @keyup=${(e: any) => setNewBeadText(e.target.value)}
                  @change=${(e: any) => setNewBeadText(e.target.value)}
                ></textarea>
              </div>
              <button
                @click=${() => saveNewBead()}
                class='button'
              >
                Add new bead
              </button>
            </div>
          </div>

          <div style='position: relative; height: 700px'>
            <img src='https://s3.eu-west-2.amazonaws.com/wiki.weco.io/mementer-infinity.svg' alt='mementer-infinty' class='mementer-infinity gold' />
            <div id='canvas'></div>
          </div>

          <div class='selected-beads'>
            ${selectedBeads.map((bead) => 
              html`
                <div class='bead-card'>
                  <p>${formatDate(new Date(bead.timeStamp))} | ${beadSlicesText(new Date(bead.timeStamp))}</p>
                  <textarea
                    rows='14'
                    .value=${bead.text}
                    @keyup=${(e: any) => setNewBeadText(e.target.value)}
                    @change=${(e: any) => setNewBeadText(e.target.value)}
                  ></textarea>
                </div>
              `
            )}
          </div>
        </div>

        <duration-bar
          .startDate=${settings.startDate}
          .endDate=${settings.endDate}
          .size=${'large'}
          style='width: 842px; margin-bottom: 20px; margin-top: -4px;'
        ></duration-bar>
        
      </div>
    `
}

customElements.define('the-mementer', component(Mementer as any));
