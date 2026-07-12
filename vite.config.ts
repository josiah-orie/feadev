import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about-us.html'),
        programs: resolve(__dirname, 'programs.html'),
        academy: resolve(__dirname, 'academy.html'),
        events: resolve(__dirname, 'events.html'),
        media: resolve(__dirname, 'media.html'),
        partners: resolve(__dirname, 'partners.html'),
        community: resolve(__dirname, 'community.html'),
        careers: resolve(__dirname, 'careers.html'),
        contact: resolve(__dirname, 'contact.html'),
        legal: resolve(__dirname, 'legal.html'),
        registerAthlete: resolve(__dirname, 'register-athlete.html'),
        registerCoach: resolve(__dirname, 'register-coach.html'),
        verifyEmail: resolve(__dirname, 'verify-email.html'),
        wheelchairArticle: resolve(__dirname, 'articles/wheelchair-football.html'),
      },
    },
  },
})
