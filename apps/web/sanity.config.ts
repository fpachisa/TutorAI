import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './sanity/schemaTypes'
import {projectId, dataset} from './sanity/env'

export default defineConfig({
  name: 'tutorai',
  title: 'TutorAI Curriculum Management',
  
  projectId,
  dataset,
  
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Curriculum Subtopics')
              .child(
                S.documentTypeList('subtopic')
                  .title('All Subtopics')
                  .filter('_type == "subtopic"')
                  .defaultOrdering([
                    {field: 'path.grade', direction: 'asc'},
                    {field: 'path.subject', direction: 'asc'},
                    {field: 'path.topic', direction: 'asc'},
                    {field: 'metadata.order', direction: 'asc'}
                  ])
              ),
            
            // Organize by grade
            S.listItem()
              .title('By Grade')
              .child(
                S.list()
                  .title('Grades')
                  .items([
                    S.listItem()
                      .title('Primary 6')
                      .child(
                        S.documentTypeList('subtopic')
                          .title('Primary 6 Subtopics')
                          .filter('_type == "subtopic" && path.grade == "primary-6"')
                          .defaultOrdering([
                            {field: 'path.subject', direction: 'asc'},
                            {field: 'path.topic', direction: 'asc'},
                            {field: 'metadata.order', direction: 'asc'}
                          ])
                      )
                  ])
              ),
              
            // Organize by subject  
            S.listItem()
              .title('By Subject')
              .child(
                S.list()
                  .title('Subjects')
                  .items([
                    S.listItem()
                      .title('Mathematics')
                      .child(
                        S.documentTypeList('subtopic')
                          .title('Mathematics Subtopics')
                          .filter('_type == "subtopic" && path.subject == "mathematics"')
                          .defaultOrdering([
                            {field: 'path.topic', direction: 'asc'},
                            {field: 'metadata.order', direction: 'asc'}
                          ])
                      )
                  ])
              )
          ])
    }),
    visionTool()
  ],
  
  schema: {
    types: schemaTypes,
  },
})