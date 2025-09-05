import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'practiceItem',
  title: 'Practice Item',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'type',
      title: 'Item Type',
      type: 'string',
      options: {
        list: [
          {title: 'Word Problem', value: 'word_problem'},
          {title: 'Multiple Choice', value: 'multiple_choice'},
          {title: 'Fill in the Blank', value: 'fill_blank'}
        ]
      }
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          {title: 'Easy', value: 'E'},
          {title: 'Medium', value: 'M'},
          {title: 'Hard', value: 'H'}
        ]
      }
    }),
    defineField({
      name: 'stem',
      title: 'Question Stem',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'string'
    }),
    defineField({
      name: 'worked',
      title: 'Worked Solution',
      type: 'array',
      of: [{type: 'string'}]
    }),
    defineField({
      name: 'conceptTags',
      title: 'Concept Tags',
      type: 'array',
      of: [{type: 'string'}]
    })
  ]
})