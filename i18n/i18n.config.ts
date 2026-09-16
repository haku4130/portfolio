export default defineI18nConfig(() => ({
  legacy: false,
  messages: {
    ru: {
      nav: {
        home: 'Главная',
        projects: 'Проекты',
        about: 'Обо мне'
      },
      hero: {
        available: 'Доступен для новых проектов',
        unavailable: 'В настоящее время недоступен'
      },
      projects: {
        view: 'Открыть проект',
        all: 'Все проекты'
      },
      experience: {
        visit: 'Перейти на сайт'
      },
      resume: {
        download: 'Скачать резюме'
      },
      footer: {
        credits: 'Разработано с Nuxt'
      },
      lang: {
        switch: 'Сменить язык'
      }
    },
    en: {
      nav: {
        home: 'Home',
        projects: 'Projects',
        about: 'About'
      },
      hero: {
        available: 'Available for new projects',
        unavailable: 'Not available at the moment'
      },
      projects: {
        view: 'View Project',
        all: 'All projects'
      },
      experience: {
        visit: 'Visit website'
      },
      resume: {
        download: 'Download CV'
      },
      footer: {
        credits: 'Built with Nuxt'
      },
      lang: {
        switch: 'Switch language'
      }
    }
  }
}))
