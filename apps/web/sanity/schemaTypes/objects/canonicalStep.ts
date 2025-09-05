import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'canonicalStep',
  title: 'Canonical Solution Step',
  type: 'object',
  fields: [
    defineField({
      name: 'step',
      title: 'Step Number',
      type: 'number',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'examples',
      title: 'Examples',
      type: 'array',
      of: [{type: 'string'}]
    })
  ]
})