/**
 * Events page module.
 * Fetches events from the API and renders them dynamically.
 */

import { fetchEvents, getImageUrl } from './api-client.js'

/**
 * Formats a date string (yyyy-MM-dd) to a readable format.
 * @param {string} dateStr - Date in yyyy-MM-dd format
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Formats a time string (HH:mm:ss) to a readable format.
 * @param {string} timeStr - Time in HH:mm:ss format
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${period}`
}

/**
 * Escapes HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str || ''))
  return div.innerHTML
}

/**
 * Builds the registration link URL for an event.
 * @param {Object} event
 * @returns {string}
 */
function buildRegistrationUrl(event) {
  const params = new URLSearchParams({
    eventId: event.id,
    eventName: event.name,
    eventDate: formatDate(event.startDate),
    eventTime: event.startTime && event.endTime
      ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
      : formatTime(event.startTime) || '',
    eventVenue: event.location || '',
  })
  return `/event-registration.html?${params.toString()}`
}

/**
 * Determines the appropriate button/link for an event card based on status.
 * @param {Object} event
 * @returns {string} HTML string
 */
function buildActionButton(event) {
  if (event.status === 'REGISTRATION_OPEN') {
    const url = escapeHtml(buildRegistrationUrl(event))
    return `<a class="btn btn-brand" href="${url}">Register to Attend</a>`
  }
  if (event.status === 'REGISTRATION_CLOSED') {
    return `<button class="btn btn-brand disabled" disabled aria-disabled="true">Registration Closed</button>`
  }
  if (event.status === 'DRAFT') {
    return `<button class="btn btn-brand disabled" disabled aria-disabled="true">Registration Opening Soon</button>`
  }
  if (event.status === 'IN_PROGRESS') {
    return `<span class="badge bg-success fs-6 px-3 py-2">Event In Progress</span>`
  }
  if (event.status === 'COMPLETED') {
    return `<span class="badge bg-secondary fs-6 px-3 py-2">Event Completed</span>`
  }
  if (event.status === 'CANCELLED') {
    return `<span class="badge bg-danger fs-6 px-3 py-2">Event Cancelled</span>`
  }
  return `<button class="btn btn-brand disabled" disabled aria-disabled="true">Coming Soon</button>`
}

/**
 * Renders a single event card.
 * @param {Object} event
 * @param {boolean} featured - Whether this is the featured (full-width) card
 * @returns {string} HTML string
 */
function renderEventCard(event, featured = false) {
  const name = escapeHtml(event.name)
  const description = escapeHtml(event.description || '')
  const eventType = escapeHtml(event.eventType || '')
  const location = escapeHtml(event.location || '')
  const state = escapeHtml(event.state || '')
  const dateStr = formatDate(event.startDate)
  const timeStr = event.startTime && event.endTime
    ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
    : formatTime(event.startTime) || ''

  const imageUrl = event.imagePath ? getImageUrl(event.imagePath) : event.eventImage || ''
  const imageHtml = imageUrl
    ? `<div class="mb-3" style="height: ${featured ? '240px' : '180px'}; overflow: hidden; border-radius: var(--af-radius); border: 1px solid rgba(255, 255, 255, 0.1);">
        <img src="${escapeHtml(imageUrl)}" class="w-100 h-100 object-fit-cover" alt="${name}" />
      </div>`
    : `<div class="img-placeholder mb-3" style="min-height: ${featured ? '200px' : '160px'}" role="img" aria-label="${name}">
        <span class="img-placeholder-type">Event banner</span>
        <p class="img-placeholder-desc mb-0">${name}</p>
      </div>`

  const colClass = featured ? 'col-12' : 'col-lg-6'
  const featuredClass = featured ? 'event-featured' : ''

  return `
    <div class="${colClass}">
      <article class="event-card ${featuredClass} program-page-card p-4 h-100">
        ${imageHtml}
        <span class="statement-kicker">${eventType}</span>
        <h3 class="${featured ? 'h4' : 'h5'} fw-bold mt-2 mb-1">${name}</h3>
        <div class="row g-2 mb-3">
          ${dateStr ? `<div class="col-sm-auto"><span class="text-white-75"><span aria-hidden="true">📅</span> ${dateStr}</span></div>` : ''}
          ${timeStr ? `<div class="col-sm-auto"><span class="text-white-75"><span aria-hidden="true">🕐</span> ${timeStr}</span></div>` : ''}
          ${location ? `<div class="col-sm-auto"><span class="text-white-75"><span aria-hidden="true">📍</span> ${location}${state ? ', ' + state : ''}</span></div>` : ''}
        </div>
        ${description ? `<p class="mb-3 text-muted">${description}</p>` : ''}
        ${buildActionButton(event)}
      </article>
    </div>
  `
}

/**
 * Initializes the events page — fetches events and renders them.
 */
export async function initEventsPage() {
  const container = document.getElementById('eventsContainer')
  if (!container) return

  // Show loading state
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading events...</span>
      </div>
      <p class="text-muted mt-3">Loading events...</p>
    </div>
  `

  const result = await fetchEvents({ sortBy: 'startDate', sortDir: 'asc', size: 50 })

  if (!result.ok) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning" role="alert">
          Unable to load events at this time. Please try again later.
        </div>
      </div>
    `
    return
  }

  const events = result.data?.content || []

  if (events.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <p class="text-muted text-center py-4">No upcoming events at this time. Check back soon!</p>
      </div>
    `
    return
  }

  // Render: first event as featured, rest as regular cards
  let html = ''
  events.forEach((event, index) => {
    html += renderEventCard(event, index === 0)
  })
  container.innerHTML = html
}

/**
 * Fetches the exhibition game event and updates the hero slider registration link.
 * Used on the landing page (index.html).
 */
export async function initHeroEventLink() {
  // Look for the exhibition game link in the hero slider
  const heroLink = document.querySelector('.hero-slide--exhibition .btn-brand')
  if (!heroLink) return

  // Fetch events filtered to find the exhibition game
  const result = await fetchEvents({ sortBy: 'startDate', sortDir: 'asc', size: 10 })

  if (!result.ok || !result.data?.content?.length) return

  // Find the exhibition game event (look for "Wheelchair" or "Exhibition" in name/type)
  const events = result.data.content
  const exhibitionEvent = events.find(e =>
    (e.name && e.name.toLowerCase().includes('wheelchair')) ||
    (e.name && e.name.toLowerCase().includes('exhibition')) ||
    (e.eventType && e.eventType.toLowerCase().includes('exhibition'))
  )

  if (!exhibitionEvent) return

  // Update the hero slider link with the real event ID
  if (exhibitionEvent.status === 'REGISTRATION_OPEN') {
    heroLink.href = buildRegistrationUrl(exhibitionEvent)
    heroLink.textContent = 'Register to Attend →'
    heroLink.classList.remove('disabled')
    heroLink.removeAttribute('aria-disabled')
  } else if (exhibitionEvent.status === 'DRAFT') {
    // Replace link with disabled button
    const btn = document.createElement('button')
    btn.className = 'btn btn-brand btn-lg px-4 disabled'
    btn.disabled = true
    btn.setAttribute('aria-disabled', 'true')
    btn.textContent = 'Registration Opening Soon'
    heroLink.replaceWith(btn)
  }
}
