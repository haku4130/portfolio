import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const createBaseSchema = () =>
  z.object({
    title: z.string(),
    description: z.string()
  })

const createButtonSchema = () =>
  z.object({
    label: z.string(),
    icon: z.string().optional(),
    to: z.string().optional(),
    color: z
      .enum(['primary', 'neutral', 'success', 'warning', 'error', 'info'])
      .optional(),
    size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
    variant: z
      .enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link'])
      .optional(),
    target: z.enum(['_blank', '_self']).optional()
  })

const createImageSchema = () =>
  z.object({
    src: z.string().editor({ input: 'media' }),
    alt: z.string()
  })

const createAuthorSchema = () =>
  z.object({
    name: z.string(),
    description: z.string().optional(),
    username: z.string().optional(),
    twitter: z.string().optional(),
    to: z.string().optional(),
    avatar: createImageSchema().optional()
  })

const createTestimonialSchema = () =>
  z.object({
    quote: z.string(),
    author: createAuthorSchema()
  })

const createSeoSchema = () =>
  z.object({
    title: z.string(),
    description: z.string()
  })

const createIndexSchema = () =>
  z.object({
    seo: createSeoSchema(),
    title: z.string(),
    description: z.string(),
    hero: z.object({
      links: z.array(createButtonSchema())
    }),
    about: createBaseSchema(),
    experience: createBaseSchema().extend({
      items: z.array(
        z.object({
          date: z.string(),
          position: z.string(),
          summary: z.string().optional(),
          details: z.array(z.string()).optional(),
          stack: z.array(z.string()).optional(),
          company: z.object({
            name: z.string(),
            url: z.string().optional(),
            logo: z.string(),
            color: z.string()
          })
        })
      )
    }),
    education: createBaseSchema().extend({
      items: z.array(
        z.object({
          date: z.string(),
          degree: z.string(),
          institution: z.string(),
          url: z.string().optional(),
          logo: z.string().optional()
        })
      )
    }),
    stack: createBaseSchema().extend({
      items: z.array(
        z.object({
          name: z.string(),
          icon: z.string(),
          color: z.string()
        })
      )
    }),
    testimonials: z.array(createTestimonialSchema()),
    faq: createBaseSchema().extend({
      categories: z.array(
        z.object({
          title: z.string().nonempty(),
          questions: z.array(
            z.object({
              label: z.string().nonempty(),
              content: z.string().nonempty()
            })
          )
        })
      )
    })
  })

const createAboutSchema = () =>
  z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
    images: z.array(createImageSchema())
  })

const createProjectSchema = () =>
  z.object({
    title: z.string().nonempty(),
    description: z.string().nonempty(),
    image: z.string().nonempty().editor({ input: 'media' }),
    url: z.string().nonempty(),
    tags: z.array(z.string()),
    date: z.string()
  })

const createProjectsPageSchema = () =>
  z.object({
    title: z.string(),
    description: z.string(),
    links: z.array(createButtonSchema())
  })

export default defineContentConfig({
  collections: {
    indexRu: defineCollection({
      type: 'data',
      source: 'ru/index.yml',
      schema: createIndexSchema()
    }),
    indexEn: defineCollection({
      type: 'data',
      source: 'en/index.yml',
      schema: createIndexSchema()
    }),
    aboutRu: defineCollection({
      type: 'data',
      source: 'ru/about.yml',
      schema: createAboutSchema()
    }),
    aboutEn: defineCollection({
      type: 'data',
      source: 'en/about.yml',
      schema: createAboutSchema()
    }),
    projectsPageRu: defineCollection({
      type: 'data',
      source: 'ru/projects.yml',
      schema: createProjectsPageSchema()
    }),
    projectsPageEn: defineCollection({
      type: 'data',
      source: 'en/projects.yml',
      schema: createProjectsPageSchema()
    }),
    projectsRu: defineCollection({
      type: 'data',
      source: 'ru/projects/*.yml',
      schema: createProjectSchema()
    }),
    projectsEn: defineCollection({
      type: 'data',
      source: 'en/projects/*.yml',
      schema: createProjectSchema()
    })
  }
})
