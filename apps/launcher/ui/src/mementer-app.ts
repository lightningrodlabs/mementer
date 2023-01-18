/* eslint-disable no-nested-ternary */
/* eslint-disable no-use-before-define */
import { html, LitElement } from 'lit';
import { component, useState, useRef, useEffect } from 'haunted';
import { v4 as uuidv4 } from 'uuid';
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
    const [loading, setLoading] = useState(true)
    const [selectedBeads, setSelectedBeads] = useState<any[]>([])
    const [newBeadText, setNewBeadText] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [duration, setDuration] = useState(0)
    const [durationModalOpen, setDurationModalOpen] = useState(false)
    const [years, setYears] = useState(0)
    const [days, setDays] = useState(0)
    const [numberOfSlices] = useState({ large: 24, medium: 12, small: 6 })
    const beads = useRef<any[]>([])
    const focusStateRef = useRef<focusStates>('default')
    const selectedSlices = useRef<any>({ large: 0, medium: 0, small: 0 })
    const circleDurations = useRef<any>({ large: 0, medium: 0, small: 0 })
    const startDateRef = useRef('')
    const endDateRef = useRef('')

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

    function pluralise(number: number): string {
      return number < 1 || number > 1 ? 's' : ''
    }

    function findArc(size: sizes, start: number, end: number) {
        const outerRadius = focusStateScales[focusStateRef.current][size] * circleSize / 2
        const slice = Math.PI * 2 / numberOfSlices[size]
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
        .attr('transform', `scale(${focusStateScales[focusStateRef.current][size] / 2})`)
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

    function selectSlice(size: sizes, index: number) {
      const start = startDateRef.current
      const end = endDateRef.current
      const now = new Date().getTime()
      const timeSinceStart = now - new Date(start).getTime()
      const finished = new Date(end).getTime() < now
      const notStarted = new Date(start).getTime() > now
      const newSelectedSlices = { ...selectedSlices.current }
      const largeSliceDuration = circleDurations.current.large / numberOfSlices.large
      const mediumSliceDuration = circleDurations.current.medium / numberOfSlices.medium
      const smallSliceDuration = circleDurations.current.small / numberOfSlices.small
      const currentLargeSlice = finished || notStarted ? 1 : Math.floor(timeSinceStart / largeSliceDuration) + 1
      const largeSliceOffset = (currentLargeSlice - 1) * largeSliceDuration
      const currentMediumSlice = finished || notStarted ? 1 : Math.floor((timeSinceStart - largeSliceOffset) / mediumSliceDuration) + 1

      if (size === 'large') {
        // update selected slices
        newSelectedSlices.large = index
        newSelectedSlices.medium = 0
        newSelectedSlices.small = 0
        selectedSlices.current = newSelectedSlices
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
          } else startTimers(start, end)
        }
      }

      if (size === 'medium') {
        // update selected slices
        newSelectedSlices.large = selectedSlices.current.large || currentLargeSlice || 1
        newSelectedSlices.medium = index
        newSelectedSlices.small = 0
        selectedSlices.current = newSelectedSlices
        createSlices('small')
        // update timers
        const beforeLargeSlice = newSelectedSlices.large < currentLargeSlice
        const afterLargeSlice = newSelectedSlices.large > currentLargeSlice
        if (start && end) {
          if (finished || beforeLargeSlice || (index < currentMediumSlice && !afterLargeSlice)) createStaticTimer('small')
          else if (notStarted || afterLargeSlice || index > currentMediumSlice) removeTimer('small')
          else startTimers(start, end)
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
      const startTime = new Date(start).getTime()
      const { large, medium, small } = newSelectedSlices
      const selectedSliceStart = startTime + ((large ? large - 1 : 0) * largeSliceDuration) + ((medium ? medium - 1 : 0) * mediumSliceDuration) + ((small ? small - 1 : 0) * smallSliceDuration)
      const length = small ? smallSliceDuration : medium ? mediumSliceDuration : largeSliceDuration
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
      const startTime = new Date(startDateRef.current).getTime()
      const largeSliceDuration = circleDurations.current.large / numberOfSlices.large
      const mediumSliceDuration = circleDurations.current.medium / numberOfSlices.medium
      const smallSliceDuration = circleDurations.current.small / numberOfSlices.small
      const { large, medium } = selectedSlices.current
      const largeOffset = (large ? large - 1 : 0) * largeSliceDuration
      const mediumOffset = (medium ? medium - 1 : 0) * mediumSliceDuration
      if (size === 'large') {
        sliceStart = startTime + (largeSliceDuration * index)
        sliceEnd = sliceStart + largeSliceDuration
      }
      if (size === 'medium') {
        sliceStart = startTime + largeOffset + (mediumSliceDuration * index)
        sliceEnd = sliceStart + mediumSliceDuration
      }
      if (size === 'small') {
        sliceStart = startTime + largeOffset + mediumOffset + (smallSliceDuration * index)
        sliceEnd = sliceStart + smallSliceDuration
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
        for (let i = 0; i < numberOfSlices[size]; i += 1) {
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
      d3.select(timer!).transition('size').duration(1000).attr('transform', `scale(${focusStateScales[focusStateRef.current][size] / 2})`)
    }
  
    function updateFocusState(focus: focusStates) {
        focusStateRef.current = focus
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

    function findDuration(start: string, end: string) {
      return new Date(end).getTime() - new Date(start).getTime()
    }

    function formatDate(date: Date) {
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }

    function findSlicesFromDate(date: Date) {
      const startTime = new Date(startDateRef.current).getTime()
      const beadTime = new Date(date).getTime()
      const timeSinceStart = beadTime - startTime
      const largeSliceDuration = circleDurations.current.large / numberOfSlices.large
      const mediumSliceDuration = circleDurations.current.medium / numberOfSlices.medium
      const smallSliceDuration = circleDurations.current.small / numberOfSlices.small
      const largeSlice = Math.floor(timeSinceStart / largeSliceDuration) + 1
      const largeSliceOffset = (largeSlice - 1) * largeSliceDuration
      const mediumSlice = Math.floor((timeSinceStart - largeSliceOffset) / mediumSliceDuration) + 1
      const mediumSliceOffset = ((largeSlice - 1) * largeSliceDuration) + ((mediumSlice - 1) * mediumSliceDuration)
      const smallSlice = Math.floor((timeSinceStart - mediumSliceOffset) / smallSliceDuration) + 1
      return { large: largeSlice, medium: mediumSlice, small: smallSlice }
    }

    function beadSlicesText(date: Date) {
      const { large, medium, small } = findSlicesFromDate(date)
      return `L${large}-M${medium}-S${small}`
    }

    function findNewCircleDurations(newDuration: number) {
      return {
        small: newDuration / numberOfSlices.large / numberOfSlices.medium,
        medium: newDuration / numberOfSlices.large,
        large: newDuration
      }
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
          .attr('transform', `scale(${focusStateScales[focusStateRef.current][size] / 2})`)
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

    function startTimers(start: string, end: string) {
      // update circle durations
      const newDuration = findDuration(start, end)
      const newCircleDurations = findNewCircleDurations(newDuration)
      circleDurations.current = newCircleDurations
      // calculate slice offsets and start timers
      const now = new Date().getTime()
      const finished = new Date(end).getTime() < now
      const notStarted = new Date(start).getTime() > now
      if (finished) sizesArray.forEach((size) => createStaticTimer(size))
      else if (notStarted) sizesArray.forEach((size) => removeTimer(size))
      else {
        const largeOffset = now - new Date(start).getTime()
        createTimer('large', newCircleDurations.large, largeOffset)
        const largeSliceDuration = newCircleDurations.large / numberOfSlices.large
        const largeSlicesFinished = Math.floor(largeOffset / largeSliceDuration)
        const mediumOffset = largeOffset - (largeSlicesFinished * largeSliceDuration)
        createTimer('medium', newCircleDurations.medium, mediumOffset)
        const mediumSliceDuration = newCircleDurations.medium / numberOfSlices.medium
        const mediumSlicesFinished = Math.floor(mediumOffset / mediumSliceDuration)
        const smallOffset = mediumOffset - (mediumSlicesFinished * mediumSliceDuration)
        createTimer('small', newCircleDurations.small, smallOffset)
      }
    }

    function findTotalYearsAndDays(milliseconds: number) {
      const day = 1000 * 60 * 60 * 24
      const year = day * 365
      const totalYears = Math.floor(milliseconds / year)
      const totalDays = Math.floor(milliseconds / day) - totalYears * 365
      return { totalYears, totalDays }
    }
  
    function findCircleDurationText(size: sizes) {
      if (startDate && endDate) {
        const { totalYears, totalDays } = findTotalYearsAndDays(circleDurations.current[size] / numberOfSlices[size])
        if (totalYears || totalDays) {
          const y = totalYears ? `${totalYears} year${pluralise(totalYears)}` : ''
          const d = totalDays ? `${totalDays} day${pluralise(totalDays)}` : ''
          return totalYears || totalDays ? `(${y}${totalYears && totalDays ? ', ' : ''}${d} / slice)` : ''
        }
        return '(<1 day / slice)'
      }
      return ''
    }
  
    function updateSlices(size: sizes, slices: number) {
      numberOfSlices[size] = slices < 1 ? 1 : slices
      selectedSlices.current = { large: 0, medium: 0, small: 0 }
      sizesArray.forEach((s) => createSlices(s))
      if (startDate && endDate) startTimers(startDate, endDate)
    }
  
    function saveNewBead() {
      let timeStamp = new Date()
      const { large, medium, small } = selectedSlices.current
      const selectedSlice = large || medium || small
      if (selectedSlice) {
        // find start of selected slice
        const largeSliceDuration = circleDurations.current.large / numberOfSlices.large
        const mediumSliceDuration = circleDurations.current.medium / numberOfSlices.medium
        const smallSliceDuration = circleDurations.current.small / numberOfSlices.small
        const largeDuration = largeSliceDuration * (large - 1)
        const mediumDuration = mediumSliceDuration * (medium ? medium - 1 : 0)
        const smallDuration = smallSliceDuration * (small ? small - 1 : 0)
        const durationFromStartDate = largeDuration + mediumDuration + smallDuration
        timeStamp = new Date(new Date(startDate).getTime() + durationFromStartDate)
      }
      const newBead = { id: uuidv4(), text: newBeadText, timeStamp, createdAt: new Date() }
      beads.current.push(newBead)
      if (selectedSlice) setSelectedBeads([...selectedBeads, newBead])
      setNewBeadText('')
      // highlight bead slices
      const highlightedSlices = selectedSlice ? selectedSlices.current : findSlicesFromDate(new Date())
      sizesArray.forEach((size) => {
        const path = shadowRoot?.getElementById(`${size}-arc-${highlightedSlices[size]}`)
        if (path) d3.select(path).classed('has-content', true).transition('fill').duration(300).style('fill', colors.green1)
      })
    }

    function updateOtherDate(position: 'start' | 'end', knownDate: string, milliseconds: number) {
      const time = position === 'start' ? -milliseconds : milliseconds
      const newDate = formatDate(new Date(new Date(knownDate).getTime() + time))
      if (position === 'start') {
        setStartDate(newDate)
        startDateRef.current = newDate
      } else {
        setEndDate(newDate)
        endDateRef.current = newDate
      }
      shadowRoot!.getElementById(`${position}-date`).setDate(newDate)
      const start = position === 'start' ? newDate : startDate
      const end = position === 'end' ? newDate : endDate
      selectedSlices.current = { large: 0, medium: 0, small: 0 }
      sizesArray.forEach((size) => createSlices(size))
      startTimers(start, end)
    }

    function updateDuration(newDuration: number) {
      // used when start or end dates changed
      setDuration(newDuration)
      const { totalYears, totalDays } = findTotalYearsAndDays(newDuration)
      setYears(totalYears)
      setDays(totalDays)
    }

    function changeDate(position: 'start' | 'end') {
      const newDate = shadowRoot.querySelector(`#${position}-date`).getValue()
      if (position === 'start') {
        setStartDate(newDate)
        startDateRef.current = newDate
        if (endDate) {
          updateDuration(findDuration(newDate, endDate))
          selectedSlices.current = { large: 0, medium: 0, small: 0 }
          sizesArray.forEach((size) => createSlices(size))
          startTimers(newDate, endDate)
        } else if (duration) updateOtherDate('end', newDate, duration)
      } else {
        setEndDate(newDate)
        endDateRef.current = newDate
        if (startDate) {
          updateDuration(findDuration(startDate, newDate))
          selectedSlices.current = { large: 0, medium: 0, small: 0 }
          sizesArray.forEach((size) => createSlices(size))
          startTimers(startDate, newDate)
        } else if (duration) updateOtherDate('start', newDate, duration)
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

    function openDatePicker(position: 'start' | 'end') {
      shadowRoot!.getElementById(`${position}-date`).open()
    }

    function durationText(milliseconds: number): string {
      const { totalYears, totalDays } = findTotalYearsAndDays(milliseconds)
      const yearsText = totalYears > 0 ? `${totalYears} year${pluralise(totalYears)}` : ''
      const daysText = totalDays > 0 ? `${totalDays} day${pluralise(totalDays)}` : ''
      return `${yearsText}${totalYears > 0 && totalDays > 0 ? ', ' : ''}${daysText}`
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
      <style>
        p, h3 { margin: 0 }
        .button {
          all: unset;
          cursor: pointer;
          background-color: #8bc8ff;
          border-radius: 5px;
          padding: 10px;
        }
        .close-button {
          all: unset;
          cursor: pointer;
          position: absolute;
          right: 0;
          background-color: #eee;
          border-radius: 50%;
          width: 25px;
          height: 25px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .duration-modal {
          position: absolute;
          top: 150px;
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 0 15px 0 rgba(0,0,0, 0.15);
          width: 300px;
          z-index: 5;
        }
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
          width: 300px;
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
      </style>
      <div style="display: flex; flex-direction: column; height: 100%; width: 100%; align-items: center;">
        <h1>The Mementer: The Chronogram of Life</h1>

        <div style="width: 800px; display: flex; justify-content: space-between; margin-bottom: 40px">
          <div style="display: flex; flex-direction: column; align-items: center">
            <div style="width: 35px; height: 35px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center">
              <img src='https://upload.wikimedia.org/wikipedia/commons/5/54/Letter_A.svg' alt='alpha' class="gold" style="width: 35px; height: 35px" />
            </div>
            <p style="margin-bottom: 20px">${startDate || '∞'}</p>
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
              <button @click=${() => openDatePicker('start')} class="button">
                ${startDate ? 'Change' : 'Add'} start
              </button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; position: relative">
            <p style="height: 35px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center">Duration</p>
            <p style="margin-bottom: 20px">${duration ? `${durationText(duration)}` : '∞'}</p>
            <button @click=${() => setDurationModalOpen(true)} class="button">
              ${duration ? 'Change' : 'Add'} duration
            </button>
            ${durationModalOpen
              ? html`
                  <div class="duration-modal">
                    <div style="width: 100%; display: flex; justify-content: center; position: relative; margin-bottom: 20px">
                      <button class="close-button" @click=${() => setDurationModalOpen(false)}>X</button>
                      <h3>Duration modal</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center">
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
                      <div style="display: flex; align-items: center; margin-bottom: 20px">
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
                  </div>
                `
              : ''
            }
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; position: relative">
            <div style="width: 35px; height: 35px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center">
              <img src='https://upload.wikimedia.org/wikipedia/commons/3/3d/Code2000_Greek_omega.svg' alt='omega' class="gold" style="width: 30px; height: 30px" />
            </div>
            <p style="margin-bottom: 20px">${endDate || '∞'}</p>
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

        <div style="display: flex; margin-bottom: 40px">
          <div style="display: flex; align-items: center; justify-content: center; width: 400px">
            <p style="margin: 0 10px 0 0">Large slices</p>
            <input
              type='number'
              min='1'
              .value=${numberOfSlices.large}
              @keyup=${(e: any) => updateSlices('large', +e.target.value)}
              @change=${(e: any) => updateSlices('large', +e.target.value)}
              style="width: 50px; height: 30px; margin-right: 10px"
            >
            <p style="margin: 0">
              ${findCircleDurationText('large')}
            </p>
          </div>
          <div style="display: flex; align-items: center; justify-content: center; width: 400px">
            <p style="margin: 0 10px 0 0">Medium slices</p>
            <input
              type='number'
              min='1'
              .value=${numberOfSlices.medium}
              @keyup=${(e: any) => updateSlices('medium', +e.target.value)}
              @change=${(e: any) => updateSlices('medium', +e.target.value)}
              style="width: 50px; height: 30px; margin-right: 10px"
            >
            <p style="margin: 0">
              ${findCircleDurationText('medium')}
            </p>
          </div>
          <div style="display: flex; align-items: center; justify-content: center; width: 400px">
            <p style="margin: 0 10px 0 0">Small slices</p>
            <input
              type='number'
              min='1'
              .value=${numberOfSlices.small}
              @keyup=${(e: any) => updateSlices('small', +e.target.value)}
              @change=${(e: any) => updateSlices('small', +e.target.value)}
              style="width: 50px; height: 30px; margin-right: 10px"
            >
            <p style="margin: 0">
              ${findCircleDurationText('small')}
            </p>
          </div>
        </div>
        
        <div style='display: flex; width: 1400px'>
          <div style='width: 300px; height: 100%; margin-right: 50px'>
            ${startDate && endDate && html`
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
                  class="button"
                >
                  Add new bead
                </button>
              </div>
            `}
          </div>

          <div style='position: relative'>
            <img src='https://s3.eu-west-2.amazonaws.com/wiki.weco.io/mementer-infinity.svg' alt='mementer-infinty' class="mementer-infinity gold" />
            <div style='margin-bottom: 20px' id='canvas'></div>
          </div>

          <div style='display: flex; flex-direction: column; align-items: center; width: 300px; height: 100%; margin-left: 50px'>
            ${selectedBeads.map((bead) => 
              html`
                <div class='bead-card'>
                  <p>${formatDate(bead.timeStamp)} | ${beadSlicesText(bead.timeStamp)}</p>
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

// <div style='width: 300px; height: 100%; display: flex; flex-direction: column; align-items: center; margin-left: 40px'>
//   <p style='margin-bottom: 20px'>Large: ${selectedSlices.large}, Medium: ${selectedSlices.medium}, Small: ${selectedSlices.small}</p>
//   <p style='margin-bottom: 20px'>${findDates()}</p>
//   <div style='flex-direction: column; align-items: center; display: ${selectedSlices.large ? 'flex' : 'none'}'>
//     <textarea
//       rows='14'
//       .value=${newSliceText}
//       @keyup=${(e: any) => setNewBeadText(e.target.value)}
//       @change=${(e: any) => setNewBeadText(e.target.value)}
//       style='all: unset; width: 280px; border: 2px solid ${colors.grey1}; border-radius: 20px; background-color: white; padding: 20px; white-space: pre-wrap; margin-bottom: 20px'
//     ></textarea>
//     <button
//       @click=${() => saveNewBead()}
//       class="button"
//     >
//       Save text
//     </button>
//   </div>
// </div>

// function findDates() {
//   if (startDate && endDate) {
//     const largeSliceDuration = circleDurations.large / numberOfSlices.large
//     const mediumSliceDuration = circleDurations.medium / numberOfSlices.medium
//     const smallSliceDuration = circleDurations.small / numberOfSlices.small
//     const largeStart = new Date(startDate).getTime() + (selectedSlices.large - 1) * largeSliceDuration
//     const mediumStart = largeStart + (selectedSlices.medium - 1) * mediumSliceDuration
//     const smallStart = mediumStart + (selectedSlices.small - 1) * smallSliceDuration
//     if (selectedSlices.small) {
//       const smallEnd = smallStart + smallSliceDuration
//       return `${formatDate(new Date(smallStart))}  to  ${formatDate(new Date(smallEnd))}`
//     }
//     if (selectedSlices.medium) {
//       const mediumEnd = mediumStart + mediumSliceDuration
//       return `${formatDate(new Date(mediumStart))}  to  ${formatDate(new Date(mediumEnd))}`
//     }
//     if (selectedSlices.large) {
//       const largeEnd = largeStart + largeSliceDuration
//       return `${formatDate(new Date(largeStart))}  to  ${formatDate(new Date(largeEnd))}`
//     }
//   }
//   return '∞  to  ∞'
// }