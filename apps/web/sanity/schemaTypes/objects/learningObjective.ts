import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'learningObjective',
  title: 'Learning Objective',
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
      name: 'moeSyllabusRef',
      title: 'MOE Syllabus Reference',
      type: 'string'
    })
  ]
})