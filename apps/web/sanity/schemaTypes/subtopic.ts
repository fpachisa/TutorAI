import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'subtopic',
  title: 'Curriculum Subtopic',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Subtopic ID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'path',
      title: 'Curriculum Path',
      type: 'object',
      fields: [
        {name: 'grade', title: 'Grade', type: 'string'},
        {name: 'subject', title: 'Subject', type: 'string'},
        {name: 'topic', title: 'Topic', type: 'string'},
        {name: 'subtopic', title: 'Subtopic', type: 'string'}
      ],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      fields: [
        {name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required()},
        {name: 'description', title: 'Description', type: 'text', validation: Rule => Rule.required()},
        {
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
        },
        {name: 'estimatedTime', title: 'Estimated Time (minutes)', type: 'number'},
        {name: 'order', title: 'Order', type: 'number'},
        {name: 'icon', title: 'Icon', type: 'string'},
        {name: 'conceptTags', title: 'Concept Tags', type: 'array', of: [{type: 'string'}]},
        {name: 'moeSyllabusRef', title: 'MOE Syllabus Reference', type: 'string'}
      ]
    }),
    defineField({
      name: 'objectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [{type: 'learningObjective'}]
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{type: 'string'}]
    }),
    defineField({
      name: 'canonicalPath',
      title: 'Canonical Solution Path',
      type: 'array',
      of: [{type: 'canonicalStep'}]
    }),
    defineField({
      name: 'misconceptions',
      title: 'Common Misconceptions',
      type: 'array',
      of: [{type: 'misconception'}]
    }),
    defineField({
      name: 'socraticLadder',
      title: 'Socratic Scaffolding Ladder',
      type: 'array',
      of: [{type: 'socraticLevel'}]
    }),
    defineField({
      name: 'conversationFlow',
      title: 'Conversation Flow State Machine',
      type: 'conversationFlow'
    }),
    defineField({
      name: 'itemBank',
      title: 'Practice Item Bank',
      type: 'array',
      of: [{type: 'practiceItem'}]
    }),
    defineField({
      name: 'checkpoints',
      title: 'Assessment Checkpoints',
      type: 'array',
      of: [{type: 'checkpoint'}]
    })
  ],
  preview: {
    select: {
      title: 'metadata.name',
      subtitle: 'path.topic',
      media: 'metadata.icon'
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title,
        subtitle: `${subtitle || 'Topic'}`
      }
    }
  }
})