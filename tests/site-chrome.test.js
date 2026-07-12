import { describe, it, expect, beforeEach } from 'vitest'
import { initSiteChrome } from '../js/site-chrome.js'

describe('Navigation dropdown - Register', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.dataset.page = 'home'
    const header = document.createElement('div')
    header.id = 'site-header'
    document.body.appendChild(header)
    const footer = document.createElement('div')
    footer.id = 'site-footer'
    document.body.appendChild(footer)

    initSiteChrome()
  })

  it('renders a Register dropdown item in the nav', () => {
    const dropdownToggle = document.querySelector('.dropdown .dropdown-toggle')
    expect(dropdownToggle).not.toBeNull()
    expect(dropdownToggle.textContent).toBe('Register')
  })

  it('contains a link to /register-athlete.html with text "Athlete Registration"', () => {
    const link = document.querySelector('.dropdown-menu a[href="/register-athlete.html"]')
    expect(link).not.toBeNull()
    expect(link.textContent).toBe('Athlete Registration')
  })

  it('contains a link to /register-coach.html with text "Coach Registration"', () => {
    const link = document.querySelector('.dropdown-menu a[href="/register-coach.html"]')
    expect(link).not.toBeNull()
    expect(link.textContent).toBe('Coach Registration')
  })

  it('uses Bootstrap dropdown classes (.dropdown, .dropdown-toggle, .dropdown-menu)', () => {
    const dropdown = document.querySelector('.dropdown')
    expect(dropdown).not.toBeNull()

    const toggle = document.querySelector('.dropdown-toggle')
    expect(toggle).not.toBeNull()

    const menu = document.querySelector('.dropdown-menu')
    expect(menu).not.toBeNull()
  })
})
