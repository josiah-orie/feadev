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
        academyRegistration: resolve(__dirname, 'academy-registration.html'),
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
        theFirstSnap: resolve(__dirname, 'articles/the-first-snap.html'),
        eventRegistration: resolve(__dirname, 'event-registration.html'),
        trainingRegistration: resolve(__dirname, 'training-registration.html'),
        exhibitionGame: resolve(__dirname, 'exhibition-game.html'),
        teamLibertyPioneers: resolve(__dirname, 'team-liberty-pioneers.html'),
        teamIronInvicta: resolve(__dirname, 'team-iron-invicta.html'),
        teamAtlanticChargers: resolve(__dirname, 'team-atlantic-chargers.html'),
        teamLagosDynamos: resolve(__dirname, 'team-lagos-dynamos.html'),
      },
    },
  },
})
