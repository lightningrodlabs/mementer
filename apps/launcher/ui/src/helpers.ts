// helper functions

export function pluralise(number: number): string {
    return number < 1 || number > 1 ? 's' : ''
}

export function formatDate(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function findDuration(start: string, end: string) {
    return new Date(end).getTime() - new Date(start).getTime()
}

export function totalYearsAndDays(milliseconds: number) {
    const day = 1000 * 60 * 60 * 24
    const year = day * 365
    const totalYears = Math.floor(milliseconds / year)
    const totalDays = Math.floor(milliseconds / day) - totalYears * 365
    return { totalYears, totalDays }
}

export function durationText(milliseconds: number): string {
    const { totalYears, totalDays } = totalYearsAndDays(milliseconds)
    const yearsText = totalYears > 0 ? `${totalYears} year${pluralise(totalYears)}` : ''
    const daysText = totalDays > 0 ? `${totalDays} day${pluralise(totalDays)}` : ''
    return `${yearsText}${totalYears > 0 && totalDays > 0 ? ', ' : ''}${daysText}`
}