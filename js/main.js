/* AFEDEV — Vanilla JS enhancements (multipage) */

import { initSiteChrome } from './site-chrome.js'
import { initRegistration } from './registration.js'
import { initVerifyEmail } from './verify-email.js'

initSiteChrome()

function setupToTop() {
  const btn = document.getElementById('toTop')
  if (!btn) return

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0
    btn.classList.toggle('show', y > 600)
  }

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

function setupContactForm() {
  const form = document.getElementById('contactForm')
  const status = document.getElementById('formStatus')
  if (!form) return

  const setStatus = (text) => {
    if (status) status.textContent = text
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    if (!form.checkValidity()) {
      form.classList.add('was-validated')
      setStatus('Please complete the required fields.')
      return
    }

    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') || ''),
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      org: String(data.get('org') || ''),
      interest: String(data.get('interest') || ''),
      message: String(data.get('message') || ''),
    }

    const subject = encodeURIComponent(
      `AFEDEV enquiry: ${payload.interest || 'General'}`,
    )
    const body = encodeURIComponent(
      `Name: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nOrganization: ${payload.org}\nInterest: ${payload.interest}\n\nMessage:\n${payload.message}\n`,
    )

    setStatus('Opening your email client…')
    window.location.href = `mailto:football@feadev.com?subject=${subject}&body=${body}`

    form.reset()
    form.classList.remove('was-validated')
    setTimeout(() => setStatus(''), 1800)
  })
}

function setupNewsletterForm() {
  const form = document.getElementById('newsletterForm')
  const status = document.getElementById('newsletterStatus')
  if (!form) return

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = form.querySelector('[name="email"]')
    if (!email?.value || !email.checkValidity()) {
      if (status) status.textContent = 'Please enter a valid email address.'
      return
    }
    if (status) status.textContent = 'Thank you — newsletter signup will be connected soon.'
    form.reset()
    setTimeout(() => {
      if (status) status.textContent = ''
    }, 3000)
  })
}

setupToTop()
setupContactForm()
setupNewsletterForm()

// Registration page setup
const page = document.body.dataset.page || ''
if (page === 'register-athlete' || page === 'register-coach') {
  initRegistration()
}

// Verify email page setup
if (page === 'verify-email') {
  initVerifyEmail()
}
