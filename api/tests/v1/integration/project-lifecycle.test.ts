import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../src/app'
import { e2eTestHelpers } from '../e2e/e2e.helpers'
import { ProjectStage, TaskStatus } from '@prisma/client'

/**
 * Project Lifecycle Integration Tests
 *
 * These tests cover complete project workflows including creation, collaboration,
 * task management, team coordination, and project completion scenarios.
 */
describe('Project Lifecycle Integration Tests', () => {
  beforeEach(async () => {
    await e2eTestHelpers.setupTestDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  describe('Project Creation and Setup', () => {
    it('should handle complete project initialization workflow', async () => {
      const { user, headers } = await e2eTestHelpers.createAuthenticatedUser()

      // 1. Create new project
      const projectData = {
        name: 'Integration Test Project',
        description: 'A comprehensive project for testing',
        isPublic: true,
        stage: ProjectStage.PLANNING,
      }

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send(projectData)
        .expect(201)

      expect(projectResponse.body.success).toBe(true)
      const project = projectResponse.body.data
      expect(project.name).toBe(projectData.name)
      expect(project.userId).toBe(user.id)
      expect(project.stage).toBe(ProjectStage.PLANNING)

      // 2. Verify project appears in user's projects
      const userProjectsResponse = await request(app)
        .get('/api/v1/projects')
        .set(headers)
        .expect(200)

      expect(userProjectsResponse.body.data.length).toBe(1)
      expect(userProjectsResponse.body.data[0].id).toBe(project.id)

      // 3. Update project details
      const updateData = {
        description: 'Updated project description',
        stage: ProjectStage.IMPLEMENTATION,
      }

      const updateResponse = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set(headers)
        .send(updateData)
        .expect(200)

      expect(updateResponse.body.data.description).toBe(updateData.description)
      expect(updateResponse.body.data.stage).toBe(ProjectStage.IMPLEMENTATION)

      // 4. Create project template/structure
      const initialTasks = [
        { title: 'Project Setup', priority: 1 },
        { title: 'Requirements Gathering', priority: 2 },
        { title: 'Design Phase', priority: 3 },
        { title: 'Development Phase', priority: 4 },
        { title: 'Testing Phase', priority: 5 },
        { title: 'Deployment', priority: 6 },
      ]

      const createdTasks = []
      for (const taskData of initialTasks) {
        const taskResponse = await request(app)
          .post('/api/v1/tasks')
          .set(headers)
          .send({
            ...taskData,
            projectId: project.id,
            status: TaskStatus.TODO,
          })
          .expect(201)

        createdTasks.push(taskResponse.body.data)
      }

      // 5. Verify all tasks were created
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/tasks`)
        .set(headers)
        .expect(200)

      expect(projectTasksResponse.body.data.length).toBe(6)

      // 6. Create project documentation
      const documentationNote = {
        title: 'Project Requirements',
        content: 'Detailed project requirements and specifications',
        projectId: project.id,
        isPublic: true,
      }

      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set(headers)
        .send(documentationNote)
        .expect(201)

      expect(noteResponse.body.data.projectId).toBe(project.id)

      // 7. Verify project summary includes all components
      const projectSummaryResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/summary`)
        .set(headers)
        .expect(200)

      const summary = projectSummaryResponse.body.data
      expect(summary.tasksCount).toBe(6)
      expect(summary.notesCount).toBe(1)
      expect(summary.completionPercentage).toBe(0)
    })

    it('should handle project creation edge cases', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Test minimum viable project
      const minimalProject = {
        name: 'A', // Minimal name
      }

      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send(minimalProject)
        .expect(201)

      // Test project with maximum length data
      const maxProject = {
        name: 'X'.repeat(255),
        description: 'Y'.repeat(1000),
        isPublic: false,
      }

      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send(maxProject)
        .expect(201)

      // Test invalid project data
      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: '', // Empty name
          description: 'Valid description',
        })
        .expect(400)

      // Test special characters in project name
      const specialCharProject = {
        name: 'Project with "Special" & <Characters>',
        description: 'Testing special characters: !@#$%^&*()',
      }

      const specialResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send(specialCharProject)

      expect([201, 400]).toContain(specialResponse.status)
    })
  })

  describe('Task Management Workflow', () => {
    it('should handle complete task lifecycle within project', async () => {
      const { user, headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project
      const project = await e2eTestHelpers.createTestProject(user.id)

      // 1. Create task with full details
      const taskData = {
        title: 'Implement User Authentication',
        description:
          'Implement login, registration, and password reset functionality',
        projectId: project.id,
        priority: 1,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      }

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send(taskData)
        .expect(201)

      const task = taskResponse.body.data
      expect(task.title).toBe(taskData.title)
      expect(task.status).toBe(TaskStatus.TODO)

      // 2. Start working on task
      const startWorkResponse = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set(headers)
        .send({ status: TaskStatus.WIP })
        .expect(200)

      expect(startWorkResponse.body.data.status).toBe(TaskStatus.WIP)

      // 3. Update task progress and details
      const progressUpdate = {
        description:
          'Updated: Login functionality completed, working on registration',
        priority: 2,
      }

      await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set(headers)
        .send(progressUpdate)
        .expect(200)

      // 4. Add subtasks or related tasks
      const subtaskData = {
        title: 'Create login form validation',
        description: 'Implement client-side and server-side validation',
        projectId: project.id,
        status: TaskStatus.TODO,
        priority: 1,
      }

      const subtaskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send(subtaskData)
        .expect(201)

      // 5. Complete subtask
      await request(app)
        .put(`/api/v1/tasks/${subtaskResponse.body.data.id}`)
        .set(headers)
        .send({ status: TaskStatus.DONE })
        .expect(200)

      // 6. Complete main task
      const completeTaskResponse = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set(headers)
        .send({ status: TaskStatus.DONE })
        .expect(200)

      expect(completeTaskResponse.body.data.status).toBe(TaskStatus.DONE)

      // 7. Verify project progress
      const projectProgressResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/summary`)
        .set(headers)
        .expect(200)

      const progress = projectProgressResponse.body.data
      expect(progress.tasksCount).toBe(2)
      expect(progress.completedTasksCount).toBe(2)
      expect(progress.completionPercentage).toBe(100)

      // 8. Get task history/activity
      const taskActivityResponse = await request(app)
        .get(`/api/v1/tasks/${task.id}/activities`)
        .set(headers)
        .expect(200)

      expect(taskActivityResponse.body.data.length).toBeGreaterThan(0)
    })

    it('should handle task dependencies and relationships', async () => {
      const { user, headers } = await e2eTestHelpers.createAuthenticatedUser()
      const project = await e2eTestHelpers.createTestProject(user.id)

      // Create dependent tasks
      const task1Response = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          title: 'Database Design',
          projectId: project.id,
          priority: 1,
        })
        .expect(201)

      const task2Response = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          title: 'API Implementation',
          projectId: project.id,
          priority: 2,
        })
        .expect(201)

      await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          title: 'Frontend Integration',
          projectId: project.id,
          priority: 3,
        })
        .expect(201)

      const task1Id = task1Response.body.data.id
      const task2Id = task2Response.body.data.id

      // Complete tasks in order
      await request(app)
        .put(`/api/v1/tasks/${task1Id}`)
        .set(headers)
        .send({ status: TaskStatus.DONE })
        .expect(200)

      await request(app)
        .put(`/api/v1/tasks/${task2Id}`)
        .set(headers)
        .send({ status: TaskStatus.WIP })
        .expect(200)

      // Verify task ordering and project workflow
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/tasks?sortBy=priority`)
        .set(headers)
        .expect(200)

      const tasks = projectTasksResponse.body.data
      expect(tasks[0].priority).toBeLessThanOrEqual(tasks[1].priority)
      expect(tasks[1].priority).toBeLessThanOrEqual(tasks[2].priority)
    })

    it('should handle task assignment and collaboration', async () => {
      // Create two users for collaboration
      const { user: owner, headers: ownerHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { user: collaborator, headers: collabHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Owner creates public project
      const project = await e2eTestHelpers.createTestProject(owner.id, {
        title: 'Collaborative Project',
      })

      // Owner creates tasks and assigns them
      await request(app)
        .post('/api/v1/tasks')
        .set(ownerHeaders)
        .send({
          title: 'Owner Task',
          projectId: project.id,
          assignedUserId: owner.id,
        })
        .expect(201)

      const collabTaskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(ownerHeaders)
        .send({
          title: 'Collaborator Task',
          projectId: project.id,
          assignedUserId: collaborator.id,
        })
        .expect(201)

      // Collaborator should see their assigned task
      const assignedTasksResponse = await request(app)
        .get('/api/v1/tasks/assigned-to-me')
        .set(collabHeaders)
        .expect(200)

      expect(assignedTasksResponse.body.data.length).toBe(1)
      expect(assignedTasksResponse.body.data[0].id).toBe(
        collabTaskResponse.body.data.id,
      )

      // Collaborator updates their task
      await request(app)
        .put(`/api/v1/tasks/${collabTaskResponse.body.data.id}`)
        .set(collabHeaders)
        .send({ status: TaskStatus.WIP })
        .expect(200)

      // Owner should see the update
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/tasks`)
        .set(ownerHeaders)
        .expect(200)

      const updatedTask = projectTasksResponse.body.data.find(
        (t: { id: number }) => t.id === collabTaskResponse.body.data.id,
      )
      expect(updatedTask.status).toBe(TaskStatus.WIP)
    })
  })

  describe('Project Collaboration Features', () => {
    it('should handle team collaboration workflow', async () => {
      // Create project team
      const { user: owner, headers: ownerHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { user: member1, headers: member1Headers } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { user: member2, headers: member2Headers } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Owner creates public project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(ownerHeaders)
        .send({
          name: 'Team Project',
          description: 'A project for team collaboration',
          isPublic: true,
        })
        .expect(201)

      const project = projectResponse.body.data

      // Create shared project notes
      const sharedNoteResponse = await request(app)
        .post('/api/v1/notes')
        .set(ownerHeaders)
        .send({
          title: 'Project Documentation',
          content: 'Shared project documentation and guidelines',
          projectId: project.id,
          isPublic: true,
        })
        .expect(201)

      // Members should be able to read shared notes
      await request(app)
        .get(`/api/v1/notes/${sharedNoteResponse.body.data.id}`)
        .set(member1Headers)
        .expect(200)

      // Members create their own project notes
      await request(app)
        .post('/api/v1/notes')
        .set(member1Headers)
        .send({
          title: 'Member 1 Notes',
          content: 'Personal notes for the project',
          projectId: project.id,
          isPublic: true,
        })
        .expect(201)

      await request(app)
        .post('/api/v1/notes')
        .set(member2Headers)
        .send({
          title: 'Member 2 Notes',
          content: 'Another set of project notes',
          projectId: project.id,
          isPublic: true,
        })
        .expect(201)

      // Verify all notes are visible in project
      const projectNotesResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/notes`)
        .set(ownerHeaders)
        .expect(200)

      expect(projectNotesResponse.body.data.length).toBe(3)

      // Create tasks for different team members
      const tasks = [
        { title: 'Backend Development', assignedUserId: member1.id },
        { title: 'Frontend Development', assignedUserId: member2.id },
        { title: 'Project Management', assignedUserId: owner.id },
      ]

      for (const taskData of tasks) {
        await request(app)
          .post('/api/v1/tasks')
          .set(ownerHeaders)
          .send({
            ...taskData,
            projectId: project.id,
          })
          .expect(201)
      }

      // Verify project activity shows all team contributions
      const projectActivityResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/activities`)
        .set(ownerHeaders)
        .expect(200)

      expect(projectActivityResponse.body.data.length).toBeGreaterThan(0)
    })

    it('should handle project permissions and access control', async () => {
      const { headers: ownerHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { headers: outsiderHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Create private project
      const privateProjectResponse = await request(app)
        .post('/api/v1/projects')
        .set(ownerHeaders)
        .send({
          name: 'Private Project',
          description: 'A private project',
          isPublic: false,
        })
        .expect(201)

      const privateProject = privateProjectResponse.body.data

      // Outsider should not be able to access private project
      await request(app)
        .get(`/api/v1/projects/${privateProject.id}`)
        .set(outsiderHeaders)
        .expect(403)

      // Outsider should not see private project in public projects
      const publicProjectsResponse = await request(app)
        .get('/api/v1/projects/public')
        .set(outsiderHeaders)
        .expect(200)

      expect(publicProjectsResponse.body.data.length).toBe(0)

      // Owner can access their private project
      await request(app)
        .get(`/api/v1/projects/${privateProject.id}`)
        .set(ownerHeaders)
        .expect(200)

      // Create task in private project
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(ownerHeaders)
        .send({
          title: 'Private Task',
          projectId: privateProject.id,
        })
        .expect(201)

      // Outsider should not access tasks in private project
      await request(app)
        .get(`/api/v1/tasks/${taskResponse.body.data.id}`)
        .set(outsiderHeaders)
        .expect(403)

      // Convert project to public
      await request(app)
        .put(`/api/v1/projects/${privateProject.id}`)
        .set(ownerHeaders)
        .send({ isPublic: true })
        .expect(200)

      // Now outsider should be able to see the project
      const publicProjectsAfterResponse = await request(app)
        .get('/api/v1/projects/public')
        .set(outsiderHeaders)
        .expect(200)

      expect(publicProjectsAfterResponse.body.data.length).toBe(1)
    })
  })

  describe('Project Completion and Analytics', () => {
    it('should handle complete project lifecycle with analytics', async () => {
      // Create project with full workflow
      const workflow = await e2eTestHelpers.createCompleteUserWorkflow()
      const project = workflow.projects.personalProject

      // Track project progress through stages
      const stages = [
        ProjectStage.PLANNING,
        ProjectStage.IMPLEMENTATION,
        ProjectStage.TESTING,
        ProjectStage.DEPLOYMENT,
      ]

      for (let i = 1; i < stages.length; i++) {
        await request(app)
          .put(`/api/v1/projects/${project.id}`)
          .set(workflow.headers)
          .send({ stage: stages[i] })
          .expect(200)

        // Verify stage change is tracked
        const projectResponse = await request(app)
          .get(`/api/v1/projects/${project.id}`)
          .set(workflow.headers)
          .expect(200)

        expect(projectResponse.body.data.stage).toBe(stages[i])
      }

      // Get project completion analytics
      const analyticsResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/analytics`)
        .set(workflow.headers)
        .expect(200)

      const analytics = analyticsResponse.body.data
      expect(analytics.stage).toBe(ProjectStage.DEPLOYMENT)
      expect(analytics.completionDate).toBeDefined()
      expect(analytics.totalDuration).toBeGreaterThan(0)

      // Archive completed project
      await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set(workflow.headers)
        .send({ archived: true })
        .expect(200)

      // Archived project should not appear in active projects
      const activeProjectsResponse = await request(app)
        .get('/api/v1/projects?archived=false')
        .set(workflow.headers)
        .expect(200)

      expect(
        activeProjectsResponse.body.data.some(
          (p: { id: number }) => p.id === project.id,
        ),
      ).toBe(false)

      // But should appear in archived projects
      const archivedProjectsResponse = await request(app)
        .get('/api/v1/projects?archived=true')
        .set(workflow.headers)
        .expect(200)

      expect(
        archivedProjectsResponse.body.data.some(
          (p: { id: number }) => p.id === project.id,
        ),
      ).toBe(true)
    })

    it('should handle project deletion and cleanup', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project with related data
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 'Project to Delete',
          description: 'A project that will be deleted',
        })
        .expect(201)

      const project = projectResponse.body.data

      // Create related tasks and notes
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          title: 'Task to Delete',
          projectId: project.id,
        })
        .expect(201)

      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set(headers)
        .send({
          title: 'Note to Delete',
          content: 'This note will be deleted with the project',
          projectId: project.id,
        })
        .expect(201)

      const taskId = taskResponse.body.data.id
      const noteId = noteResponse.body.data.id

      // Soft delete project first (if implemented)
      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set(headers)
        .expect(200)

      // Verify project is not accessible
      await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set(headers)
        .expect(404)

      // Verify related data is also cleaned up
      await request(app).get(`/api/v1/tasks/${taskId}`).set(headers).expect(404)

      await request(app).get(`/api/v1/notes/${noteId}`).set(headers).expect(404)

      // Verify deletion is tracked in activity log
      const activityResponse = await request(app)
        .get('/api/v1/activities/me')
        .set(headers)
        .expect(200)

      const deletionActivity = activityResponse.body.data.find(
        (activity: { action: string }) => activity.action === 'PROJECT_DELETED',
      )
      expect(deletionActivity).toBeDefined()
    })
  })

  describe('Project Performance and Scaling', () => {
    it('should handle projects with many tasks efficiently', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 'Large Project',
          description: 'Project with many tasks',
        })
        .expect(201)

      const project = projectResponse.body.data

      // Create many tasks
      const startTime = Date.now()
      const taskPromises = []

      for (let i = 0; i < 100; i++) {
        const promise = request(app)
          .post('/api/v1/tasks')
          .set(headers)
          .send({
            title: `Task ${i + 1}`,
            description: `Description for task ${i + 1}`,
            projectId: project.id,
            priority: Math.floor(Math.random() * 5) + 1,
          })
        taskPromises.push(promise)
      }

      await Promise.all(taskPromises)
      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000) // 30 seconds

      // Test paginated task retrieval
      const paginatedResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/tasks?page=1&limit=25`)
        .set(headers)
        .expect(200)

      expect(paginatedResponse.body.data.length).toBe(25)
      expect(paginatedResponse.body.pagination.totalPages).toBe(4)

      // Test task filtering and sorting
      const filteredResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/tasks?status=TODO&sortBy=priority`)
        .set(headers)
        .expect(200)

      expect(filteredResponse.body.data.length).toBe(100) // All tasks are TODO by default
    })

    it('should handle concurrent project operations', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create base project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 'Concurrent Test Project',
          description: 'Testing concurrent operations',
        })
        .expect(201)

      const project = projectResponse.body.data

      // Simulate concurrent operations
      const operations = [
        // Task creation
        ...Array(10)
          .fill(0)
          .map((_, i) =>
            request(app)
              .post('/api/v1/tasks')
              .set(headers)
              .send({
                title: `Concurrent Task ${i + 1}`,
                projectId: project.id,
              }),
          ),
        // Note creation
        ...Array(5)
          .fill(0)
          .map((_, i) =>
            request(app)
              .post('/api/v1/notes')
              .set(headers)
              .send({
                title: `Concurrent Note ${i + 1}`,
                content: `Content for note ${i + 1}`,
                projectId: project.id,
              }),
          ),
        // Project updates
        ...Array(3)
          .fill(0)
          .map(() =>
            request(app)
              .put(`/api/v1/projects/${project.id}`)
              .set(headers)
              .send({
                description: `Updated at ${Date.now()}`,
              }),
          ),
      ]

      const results = await Promise.allSettled(operations)
      const successfulResults = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          [200, 201].includes((r.value as { status: number }).status),
      )

      // Most operations should succeed
      expect(successfulResults.length).toBeGreaterThan(15)

      // Verify final state is consistent
      const finalProjectResponse = await request(app)
        .get(`/api/v1/projects/${project.id}/summary`)
        .set(headers)
        .expect(200)

      expect(finalProjectResponse.body.data.tasksCount).toBe(10)
      expect(finalProjectResponse.body.data.notesCount).toBe(5)
    })
  })
})
