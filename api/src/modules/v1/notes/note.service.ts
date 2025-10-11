import { PrismaClient } from '@prisma/client'
import prisma from '../../../config/db'
import { CreateNoteData, UpdateNoteData, NoteQuery } from './note.model'

export class NoteService {
  // Get all notes for a user with pagination and filtering
  async getNotes(userId: number, query: NoteQuery) {
    const { page, limit, status, projectId, search } = query
    const skip = (page - 1) * limit

    const where = {
      userId,
      deletedAt: null,
      ...(status && { status }),
      ...(projectId && { projectId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { body: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, uuid: true, title: true },
          },
          user: {
            select: { id: true, uuid: true, name: true, email: true },
          },
        },
      }),
      prisma.note.count({ where }),
    ])

    return {
      data: notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  // Get a single note by UUID
  async getNoteByUuid(uuid: string, userId: number) {
    return prisma.note.findFirst({
      where: {
        uuid,
        userId,
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, uuid: true, title: true },
        },
        user: {
          select: { id: true, uuid: true, name: true, email: true },
        },
      },
    })
  }

  // Create a new note
  async createNote(userId: number, data: CreateNoteData) {
    return prisma.note.create({
      data: {
        ...data,
        userId,
      },
      include: {
        project: {
          select: { id: true, uuid: true, title: true },
        },
        user: {
          select: { id: true, uuid: true, name: true, email: true },
        },
      },
    })
  }

  // Update a note
  async updateNote(uuid: string, userId: number, data: UpdateNoteData) {
    const note = await this.getNoteByUuid(uuid, userId)
    if (!note) return null

    return prisma.note.update({
      where: { id: note.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        project: {
          select: { id: true, uuid: true, title: true },
        },
        user: {
          select: { id: true, uuid: true, name: true, email: true },
        },
      },
    })
  }

  // Soft delete a note
  async deleteNote(uuid: string, userId: number): Promise<boolean> {
    const note = await this.getNoteByUuid(uuid, userId)
    if (!note) return false

    await prisma.note.update({
      where: { id: note.id },
      data: { deletedAt: new Date() },
    })

    return true
  }

  // Restore a soft-deleted note
  async restoreNote(uuid: string, userId: number) {
    const note = await prisma.note.findFirst({
      where: {
        uuid,
        userId,
        deletedAt: { not: null },
      },
    })

    if (!note) return null

    return prisma.note.update({
      where: { id: note.id },
      data: { deletedAt: null },
      include: {
        project: {
          select: { id: true, uuid: true, title: true },
        },
        user: {
          select: { id: true, uuid: true, name: true, email: true },
        },
      },
    })
  }

  // Get notes by project
  async getNotesByProject(projectId: number, userId: number) {
    return prisma.note.findMany({
      where: {
        projectId,
        userId,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, uuid: true, name: true, email: true },
        },
      },
    })
  }
}
