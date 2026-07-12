# Project Structure

```
feadev/
├── index.html              # Home page
├── about-us.html           # About Us
├── academy.html            # Training Academy
├── careers.html            # Careers
├── community.html          # Community
├── contact.html            # Contact (mailto-based form)
├── events.html             # Events
├── legal.html              # Legal & Policies
├── media.html              # Media Hub
├── partners.html           # Partners
├── programs.html           # Programs
├── css/
│   └── styles.css          # All custom styles (single file)
├── js/
│   ├── main.js             # Entry point; imports site-chrome, sets up page behaviors
│   └── site-chrome.js      # Shared nav & footer rendered client-side via JS
├── public/
│   ├── favicon.svg
│   └── images/             # Static assets (logo, hero banner)
├── dist/                   # Build output (git-ignored)
├── vite.config.ts          # Vite multi-page build configuration
├── package.json
└── .kiro/
    └── steering/           # AI steering rules
```

## Architecture Patterns

### Multi-page static site
Each page is a standalone HTML file. Vite bundles them together but there is no SPA router.

### Shared site chrome (nav + footer)
`js/site-chrome.js` exports `initSiteChrome()` which injects the navbar and footer into placeholder `<div id="site-header">` and `<div id="site-footer">` elements. The active page is determined by `data-page` on `<body>`.

### Styling conventions
- Bootstrap utility classes for layout and spacing.
- Custom CSS uses CSS custom properties prefixed `--af-*` for theming.
- Card-style components share similar border/background/radius patterns.
- Dark theme throughout (dark background, light text).

### Adding a new page
1. Create `new-page.html` in the project root.
2. Include `data-page="page-id"` on the `<body>` tag.
3. Add the page entry to `vite.config.ts` → `rollupOptions.input`.
4. Add a nav item to the `NAV_ITEMS` array in `js/site-chrome.js`.
5. Load `main.js` via `<script type="module" src="/js/main.js"></script>`.

### Image placeholders
The site currently uses styled placeholder `<div>` elements where final images will go. These have classes like `.img-placeholder`, `.img-placeholder.tall`, `.img-placeholder.wide`.
