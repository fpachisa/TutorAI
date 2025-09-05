import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'socraticLevel',
  title: 'Socratic Scaffolding Level',
  type: 'object',
  fields: [
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Probe', value: 'probe'},
          {title: 'Hint', value: 'hint'},
          {title: 'Scaffold', value: 'scaffold'}
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'prompt',
      title: 'Prompt',
      type: 'text',
      validation: Rule => Rule.required()
    })
  ]
})