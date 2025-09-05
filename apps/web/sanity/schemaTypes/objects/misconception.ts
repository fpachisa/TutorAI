import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'misconception',
  title: 'Common Misconception',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'probe',
      title: 'Diagnostic Probe',
      type: 'text'
    }),
    defineField({
      name: 'hint',
      title: 'Corrective Hint',
      type: 'text'
    }),
    defineField({
      name: 'quickCheck',
      title: 'Quick Check Question',
      type: 'text'
    })
  ]
})