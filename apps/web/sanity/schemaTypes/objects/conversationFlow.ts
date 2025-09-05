import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'conversationFlow',
  title: 'Conversation Flow State Machine',
  type: 'object',
  fields: [
    defineField({
      name: 'states',
      title: 'States',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'id', title: 'State ID', type: 'string'},
          {name: 'intent', title: 'Intent', type: 'string'},
          {name: 'prompt', title: 'Prompt', type: 'text'},
          {name: 'checkpointRef', title: 'Checkpoint Reference', type: 'string'}
        ]
      }]
    }),
    defineField({
      name: 'transitions',
      title: 'Transitions',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          {name: 'from', title: 'From State', type: 'string'},
          {name: 'on', title: 'On Event', type: 'string'},
          {name: 'to', title: 'To State', type: 'string'}
        ]
      }]
    })
  ]
})