/* Shared navigation and footer for multipage AFEDEV site */

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'about', label: 'About', href: '/about-us.html' },
  { id: 'programs', label: 'Programs', href: '/programs.html' },
  { id: 'academy', label: 'Academy', href: '/academy.html' },
  { id: 'events', label: 'Events', href: '/events.html' },
  { id: 'media', label: 'Media', href: '/media.html' },
  { id: 'partners', label: 'Partners', href: '/partners.html' },
  { id: 'community', label: 'Community', href: '/community.html' },
  { id: 'careers', label: 'Careers', href: '/careers.html' },
  {
    id: 'register',
    label: 'Register',
    dropdown: [
      { label: 'Athlete Registration', href: '/register-athlete.html' },
      { label: 'Official Registration', href: '/register-coach.html' },
    ]
  },
]

function renderNav(activePage) {
  const links = NAV_ITEMS.map((item) => {
    if (item.dropdown) {
      const isActive = activePage.startsWith(item.id)
      const dropdownItems = item.dropdown.map((child) => {
        const childActive = activePage === child.href.replace(/^\/|\.html$/g, '') ? ' active' : ''
        return `<li><a class="dropdown-item${childActive}" href="${child.href}">${child.label}</a></li>`
      }).join('')
      return `<li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle${isActive ? ' active' : ''}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">${item.label}</a>
        <ul class="dropdown-menu dropdown-menu-dark">${dropdownItems}</ul>
      </li>`
    }
    const active = item.id === activePage ? ' active' : ''
    const current = item.id === activePage ? ' aria-current="page"' : ''
    return `<li class="nav-item"><a class="nav-link${active}" href="${item.href}"${current}>${item.label}</a></li>`
  }).join('')

  return `
    <nav
      class="navbar navbar-expand-lg navbar-dark sticky-top nav-blur border-bottom border-white border-opacity-10"
      aria-label="Primary"
    >
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="/">
          <img
            class="brand-logo"
            src="/images/logo.jpeg"
            width="32"
            height="32"
            alt="AFEDEV logo"
            loading="eager"
            decoding="async"
          />
          <span class="fw-bold">AFEDEV</span>
<!--          <span class="brand-sep" aria-hidden="true">/</span>-->
<!--          <span class="brand-subtitle d-none d-md-inline">American Football Elite Development Ltd</span>-->
        </a>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-controls="nav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="nav">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            ${links}
            <li class="nav-item ms-lg-2">
              <a class="btn btn-brand btn-sm px-3${activePage === 'contact' ? ' active' : ''}" href="/contact.html">Contact</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>`
}

function renderFooter() {
  const year = new Date().getFullYear()
  return `
    <footer class="footer border-top border-white border-opacity-10">
      <div class="container py-5">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <img
                class="brand-logo sm"
                src="/images/logo.jpeg"
                width="28"
                height="28"
                alt="AFEDEV logo"
                loading="lazy"
                decoding="async"
              />
              <div>
                <div class="fw-semibold">AFEDEV</div>
                <div class="small text-white-75">American Football Elite Development Ltd</div>
              </div>
            </div>
            <p class="small text-white-75 mb-0">
              Building the future of American football in Africa through elite training,
              education, mentorship, and global opportunities.
            </p>
          </div>
          <div class="col-6 col-lg-2">
            <div class="footer-heading">Explore</div>
            <ul class="footer-links">
              <li><a href="/about-us.html">About Us</a></li>
              <li><a href="/programs.html">Programs</a></li>
              <li><a href="/academy.html">Training Academy</a></li>
              <li><a href="/events.html">Events</a></li>
              <li><a href="/media.html">Media Hub</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <div class="footer-heading">Engage</div>
            <ul class="footer-links">
              <li><a href="/partners.html">Partners</a></li>
              <li><a href="/community.html">Community</a></li>
              <li><a href="/careers.html">Careers</a></li>
              <li><a href="/contact.html">Contact</a></li>
              <li><a href="/legal.html">Legal & Policies</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <div class="footer-heading">Stay connected</div>
            <p class="small text-white-75">Subscribe for program updates, events, and academy news.</p>
            <form class="newsletter-form" id="newsletterForm" novalidate>
              <div class="input-group">
                <input
                  type="email"
                  class="form-control"
                  name="email"
                  placeholder="Your email"
                  aria-label="Email for newsletter"
                  required
                />
                <button class="btn btn-brand" type="submit">Subscribe</button>
              </div>
              <div id="newsletterStatus" class="small text-muted mt-2" role="status" aria-live="polite"></div>
            </form>
            <div class="footer-social mt-3">
              <a href="#" aria-label="Instagram (placeholder)">Instagram</a>
              <a href="#" aria-label="YouTube (placeholder)">YouTube</a>
              <a href="#" aria-label="LinkedIn (placeholder)">LinkedIn</a>
              <a href="#" aria-label="X (placeholder)">X</a>
            </div>
          </div>
        </div>
        <hr class="border-white border-opacity-10 my-4" />
        <div class="row g-2 align-items-center">
          <div class="col-md">
            <div class="small text-white-75">© ${year} AFEDEV. All rights reserved.</div>
          </div>
          <div class="col-md-auto">
            <div class="small text-white-75">
              <a href="/legal.html">Privacy</a>
              <span aria-hidden="true"> · </span>
              <a href="/legal.html#terms">Terms</a>
              <span aria-hidden="true"> · </span>
              <a href="/legal.html#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>`
}

export function initSiteChrome() {
  const activePage = document.body.dataset.page || ''
  const headerEl = document.getElementById('site-header')
  const footerEl = document.getElementById('site-footer')
  if (headerEl) headerEl.innerHTML = renderNav(activePage)
  if (footerEl) footerEl.innerHTML = renderFooter()
}
