export default defineAppConfig({
  global: {
    picture: {
      dark: '/avatar.png',
      light: '/avatar.png',
      alt: 'Андрей Осипов'
    },
    meetingLink: 'https://t.me/haku4130',
    email: 'a.osipov.code@gmail.com',
    available: true
  },
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'neutral'
    },
    pageHero: {
      slots: {
        container: 'py-18 sm:py-24 lg:py-32',
        title: 'mx-auto max-w-3xl text-pretty text-3xl sm:text-4xl',
        description:
          'mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted whitespace-pre-line'
      }
    }
  },
  footer: {
    colorMode: false,
    links: [
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/haku4130',
        target: '_blank',
        'aria-label': 'GitHub'
      },
      {
        icon: 'i-simple-icons-telegram',
        to: 'https://t.me/haku4130',
        target: '_blank',
        'aria-label': 'Telegram'
      },
      {
        icon: 'i-lucide-mail',
        to: 'mailto:a.osipov.code@gmail.com',
        'aria-label': 'Email'
      },
      {
        icon: 'i-custom-hh',
        to: 'https://hh.ru/resume/c7218ed5ff0f69ec950039ed1f4a7233554461',
        target: '_blank',
        'aria-label': 'Резюме на HH'
      }
    ]
  }
})
