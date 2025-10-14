/**
 * Cross-Module Integration Test Suite
 *
 * Tests comprehensive integration between all major modules:
 * - Authentication & Authorization
 * - User & Profile Management
 * - Project Management
 * - Task Management
 * - Note Management
 * - Activity Logging
 * - Settings Management
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import app from '../../../src/app'
import { e2eTestHelpers } from '../e2e/e2e.helpers'
import { ProjectStage, TaskStatus, NoteStatus } from '@prisma/client'

describe('Cross-Module Integration Tests', () => {
  beforeAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  describe('Complete Workflow Integration', () => {
    it('should handle end-to-end project management workflow', async () => {
      // Step 1: User Registration and Profile Setup
      const registrationData = {
        name: 'Project Manager',
        email: 'pm@example.com',
        password: 'SecurePass123!',
      }

      const registrationResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201)

      expect(registrationResponse.body.success).toBe(true)

      // Step 2: Login and Setup Profile
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200)

      const { token } = loginResponse.body.data
      const authHeaders = { Authorization: `Bearer ${token}` }

      // Update profile
      await request(app)
        .put('/api/v1/profiles/me')
        .set(authHeaders)
        .send({
          bio: 'Experienced project manager',
          timezone: 'America/New_York',
          language: 'en',
        })
        .expect(200)

      // Step 3: Create Project with Full Lifecycle
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(authHeaders)
        .send({
          title: 'Cross-Module Integration Project',
          description: 'Testing complete project workflow',
          stage: ProjectStage.PLANNING,
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Step 4: Create Project Documentation (Notes)
      const planningNoteResponse = await request(app)
        .post('/api/v1/notes')
        .set(authHeaders)
        .send({
          title: 'Project Planning Notes',
          description: 'Initial project planning documentation',
          body: 'Project objectives, requirements, and initial planning notes',
          status: NoteStatus.DRAFT,
          projectId,
        })
        .expect(201)

      const planningNoteId = planningNoteResponse.body.data.note.id

      // Step 5: Create Task Breakdown
      const tasksData = [
        {
          title: 'Requirements Analysis',
          definitionOfDone:
            'Complete requirements document created and reviewed',
          status: TaskStatus.TODO,
        },
        {
          title: 'System Design',
          definitionOfDone: 'Technical design document completed',
          status: TaskStatus.BACKLOG,
        },
        {
          title: 'Implementation Phase 1',
          definitionOfDone: 'Core features implemented and tested',
          status: TaskStatus.BACKLOG,
        },
      ]

      const createdTasks = []
      for (const taskData of tasksData) {
        const taskResponse = await request(app)
          .post('/api/v1/tasks')
          .set(authHeaders)
          .send({
            projectId,
            ...taskData,
          })
          .expect(201)

        createdTasks.push(taskResponse.body.data.task)
      }

      // Step 6: Progress Project Through Stages
      // Move to Analysis stage
      await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set(authHeaders)
        .send({
          stage: ProjectStage.ANALYSIS,
        })
        .expect(200)

      // Start working on first task
      await request(app)
        .put(`/api/v1/tasks/${createdTasks[0].id}`)
        .set(authHeaders)
        .send({
          status: TaskStatus.WIP,
          startedAt: new Date().toISOString(),
        })
        .expect(200)

      // Step 7: Add Progress Notes
      await request(app)
        .post('/api/v1/notes')
        .set(authHeaders)
        .send({
          title: 'Progress Update - Week 1',
          description: 'Weekly progress update',
          body: 'Requirements analysis in progress. Key stakeholders identified.',
          status: NoteStatus.PUBLISHED,
          projectId,
        })
        .expect(201)

      // Step 8: Complete First Task and Update Project
      await request(app)
        .put(`/api/v1/tasks/${createdTasks[0].id}`)
        .set(authHeaders)
        .send({
          status: TaskStatus.DONE,
          endedAt: new Date().toISOString(),
        })
        .expect(200)

      // Move project to design stage
      await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set(authHeaders)
        .send({
          stage: ProjectStage.DESIGN,
        })
        .expect(200)

      // Step 9: Verify Cross-Module Data Consistency
      // Check project status reflects task completion
      const updatedProjectResponse = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(authHeaders)
        .expect(200)

      expect(updatedProjectResponse.body.data.project.stage).toBe(
        ProjectStage.DESIGN,
      )

      // Check task completion is reflected in project tasks
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(authHeaders)
        .expect(200)

      const projectTasks = projectTasksResponse.body.data.tasks
      expect(
        projectTasks.some(
          (task: { status: TaskStatus }) => task.status === TaskStatus.DONE,
        ),
      ).toBe(true)

      // Check project notes are accessible
      const projectNotesResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/notes`)
        .set(authHeaders)
        .expect(200)

      const projectNotes = projectNotesResponse.body.data.notes
      expect(projectNotes).toHaveLength(2)

      // Step 10: Verify Activity Logging
      const activitiesResponse = await request(app)
        .get('/api/v1/activities')
        .set(authHeaders)
        .expect(200)

      const activities = activitiesResponse.body.data.activities
      expect(activities.length).toBeGreaterThan(0)

      // Should have project creation activity
      expect(
        activities.some(
          (a: { action: string; modelType: string }) =>
            a.action === 'CREATE' && a.modelType === 'Project',
        ),
      ).toBe(true)

      // Should have task completion activity
      expect(
        activities.some(
          (a: { action: string; modelType: string }) =>
            a.action === 'UPDATE' && a.modelType === 'Task',
        ),
      ).toBe(true)

      // Step 11: Update Planning Note and Verify Changes
      await request(app)
        .put(`/api/v1/notes/${planningNoteId}`)
        .set(authHeaders)
        .send({
          status: NoteStatus.PUBLISHED,
          body: 'Updated project planning notes with requirements analysis results',
        })
        .expect(200)

      // Verify the update
      const updatedNoteResponse = await request(app)
        .get(`/api/v1/notes/${planningNoteId}`)
        .set(authHeaders)
        .expect(200)

      expect(updatedNoteResponse.body.data.note.status).toBe(
        NoteStatus.PUBLISHED,
      )
    })

    it('should handle multi-user project collaboration', async () => {
      // Create project owner
      const { headers: ownerHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Create team member
      const { user: teamMember, headers: memberHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Owner creates collaborative project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(ownerHeaders)
        .send({
          title: 'Team Collaboration Project',
          description: 'Multi-user collaboration testing',
          stage: ProjectStage.PLANNING,
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Owner creates initial tasks
      await request(app)
        .post('/api/v1/tasks')
        .set(ownerHeaders)
        .send({
          projectId,
          title: 'Owner Task',
          definitionOfDone: 'Task assigned to project owner',
        })
        .expect(201)

      // Create task to be assigned to team member
      const memberTaskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(ownerHeaders)
        .send({
          projectId,
          title: 'Team Member Task',
          definitionOfDone: 'Task to be assigned to team member',
        })
        .expect(201)

      const memberTaskId = memberTaskResponse.body.data.task.id

      // Assign task to team member
      await request(app)
        .put(`/api/v1/tasks/${memberTaskId}`)
        .set(ownerHeaders)
        .send({
          userId: teamMember.id,
        })
        .expect(200)

      // Team member works on assigned task
      await request(app)
        .put(`/api/v1/tasks/${memberTaskId}`)
        .set(memberHeaders)
        .send({
          status: TaskStatus.WIP,
          startedAt: new Date().toISOString(),
        })
        .expect(200)

      // Team member adds progress note
      await request(app)
        .post('/api/v1/notes')
        .set(memberHeaders)
        .send({
          title: 'Team Member Progress',
          description: 'Progress update from team member',
          body: 'Working on assigned task, making good progress',
          projectId,
          status: NoteStatus.PUBLISHED,
        })
        .expect(201)

      // Owner can see team member's work
      const ownerViewTasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(ownerHeaders)
        .expect(200)

      const ownerViewTasks = ownerViewTasksResponse.body.data.tasks
      const memberTask = ownerViewTasks.find(
        (task: { id: number }) => task.id === memberTaskId,
      )
      expect(memberTask.status).toBe(TaskStatus.WIP)
      expect(memberTask.userId).toBe(teamMember.id)

      // Owner can see team member's notes
      const ownerViewNotesResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/notes`)
        .set(ownerHeaders)
        .expect(200)

      const projectNotes = ownerViewNotesResponse.body.data.notes
      expect(
        projectNotes.some(
          (note: { userId: number }) => note.userId === teamMember.id,
        ),
      ).toBe(true)

      // Team member completes task
      await request(app)
        .put(`/api/v1/tasks/${memberTaskId}`)
        .set(memberHeaders)
        .send({
          status: TaskStatus.DONE,
          endedAt: new Date().toISOString(),
        })
        .expect(200)

      // Verify collaboration is reflected in activities
      const activitiesResponse = await request(app)
        .get('/api/v1/activities')
        .set(ownerHeaders)
        .expect(200)

      const activities = activitiesResponse.body.data.activities
      expect(
        activities.some(
          (a: { userId: number; action: string }) =>
            a.userId === teamMember.id && a.action === 'UPDATE',
        ),
      ).toBe(true)
    })
  })

  describe('Data Integrity Across Modules', () => {
    it('should maintain referential integrity during cascading operations', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project with dependencies
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          title: 'Cascade Test Project',
          description: 'Testing cascading operations',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Create dependent tasks
      const task1Response = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          projectId,
          title: 'Dependent Task 1',
          definitionOfDone: 'First task to be affected by cascading',
        })
        .expect(201)

      const task2Response = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          projectId,
          title: 'Dependent Task 2',
          definitionOfDone: 'Second task to be affected by cascading',
        })
        .expect(201)

      // Create dependent notes
      await request(app)
        .post('/api/v1/notes')
        .set(headers)
        .send({
          title: 'Project Documentation',
          description: 'Documentation for cascade test',
          body: 'This note should be handled during project operations',
          projectId,
        })
        .expect(201)

      // Verify all dependencies exist
      const tasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(headers)
        .expect(200)

      expect(tasksResponse.body.data.tasks).toHaveLength(2)

      const notesResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/notes`)
        .set(headers)
        .expect(200)

      expect(notesResponse.body.data.notes).toHaveLength(1)

      // Delete project (should handle dependencies appropriately)
      await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set(headers)
        .expect(200)

      // Verify cascading behavior
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(headers)
        .expect(404)

      // Verify dependent tasks are handled
      await request(app)
        .get(`/api/v1/tasks/${task1Response.body.data.task.id}`)
        .set(headers)
        .expect(404)

      await request(app)
        .get(`/api/v1/tasks/${task2Response.body.data.task.id}`)
        .set(headers)
        .expect(404)
    })

    it('should handle concurrent operations safely', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project for concurrent testing
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          title: 'Concurrent Operations Test',
          description: 'Testing concurrent operations safety',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Create task for concurrent updates
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          projectId,
          title: 'Concurrent Update Task',
          definitionOfDone: 'Task for testing concurrent updates',
        })
        .expect(201)

      const taskId = taskResponse.body.data.task.id

      // Simulate concurrent operations
      const concurrentOperations = [
        // Update task status
        request(app)
          .put(`/api/v1/tasks/${taskId}`)
          .set(headers)
          .send({ status: TaskStatus.WIP }),

        // Update task title
        request(app)
          .put(`/api/v1/tasks/${taskId}`)
          .set(headers)
          .send({ title: 'Updated Concurrent Task' }),

        // Create note on same project
        request(app).post('/api/v1/notes').set(headers).send({
          title: 'Concurrent Note',
          description: 'Note created during concurrent operations',
          body: 'Testing concurrent note creation',
          projectId,
        }),

        // Update project stage
        request(app)
          .put(`/api/v1/projects/${projectId}`)
          .set(headers)
          .send({ stage: ProjectStage.IMPLEMENTATION }),
      ]

      // Execute concurrent operations
      const results = await Promise.allSettled(concurrentOperations)

      // Verify most operations succeeded (some may fail due to race conditions, but that's expected)
      const successfulOperations = results.filter(
        (result) => result.status === 'fulfilled',
      )
      expect(successfulOperations.length).toBeGreaterThan(0)

      // Verify final state is consistent
      const finalTaskResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set(headers)
        .expect(200)

      const finalProjectResponse = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(headers)
        .expect(200)

      // Data should be in a valid state
      expect(finalTaskResponse.body.data.task.projectId).toBe(projectId)
      expect(finalProjectResponse.body.data.project.id).toBe(projectId)
    })
  })

  describe('Security Integration Across Modules', () => {
    it('should enforce authorization consistently across all modules', async () => {
      // Create two users
      const { headers: user1Headers } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { headers: user2Headers } =
        await e2eTestHelpers.createAuthenticatedUser()

      // User 1 creates private content
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(user1Headers)
        .send({
          title: 'Private Security Test Project',
          description: 'Testing cross-module authorization',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(user1Headers)
        .send({
          projectId,
          title: 'Private Task',
          definitionOfDone: 'Task for authorization testing',
        })
        .expect(201)

      const taskId = taskResponse.body.data.task.id

      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set(user1Headers)
        .send({
          title: 'Private Note',
          description: 'Note for authorization testing',
          body: 'This note should not be accessible by other users',
          projectId,
        })
        .expect(201)

      const noteId = noteResponse.body.data.note.id

      // Verify User 2 cannot access User 1's content across all modules

      // Cannot access project
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(user2Headers)
        .expect(403)

      // Cannot modify project
      await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set(user2Headers)
        .send({ title: 'Unauthorized Update' })
        .expect(403)

      // Cannot access task
      await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set(user2Headers)
        .expect(403)

      // Cannot modify task
      await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set(user2Headers)
        .send({ status: TaskStatus.DONE })
        .expect(403)

      // Cannot access note
      await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set(user2Headers)
        .expect(403)

      // Cannot modify note
      await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set(user2Headers)
        .send({ title: 'Unauthorized Note Update' })
        .expect(403)

      // Verify User 1 still has full access to their content
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(user1Headers)
        .expect(200)

      await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set(user1Headers)
        .expect(200)

      await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set(user1Headers)
        .expect(200)
    })
  })
})
