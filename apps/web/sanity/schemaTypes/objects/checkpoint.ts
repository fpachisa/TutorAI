import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'checkpoint',
  title: 'Assessment Checkpoint',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'stem',
      title: 'Question Stem',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'choices',
      title: 'Answer Choices',
      type: 'array',
      of: [{type: 'string'}]
    }),
    defineField({
      name: 'answer',
      title: 'Correct Answer',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'rationale',
      title: 'Answer Rationale',
      type: 'text'
    })
  ]
})