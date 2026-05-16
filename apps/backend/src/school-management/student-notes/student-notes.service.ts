import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentNote } from './entities/student-note.entity';
import { CreateStudentNoteInput } from './dto/create-student-note.input';
import { UpdateStudentNoteInput } from './dto/update-student-note.input';

@Injectable()
export class StudentNotesService {
  constructor(
    @InjectRepository(StudentNote)
    private readonly studentNotesRepository: Repository<StudentNote>,
  ) {}

  async createNote(
    input: CreateStudentNoteInput,
    authorMembershipId: string | undefined,
    organizationId: string,
  ): Promise<StudentNote> {
    const note = this.studentNotesRepository.create({
      ...input,
      authorMembershipId: authorMembershipId || null,
      organizationId,
      isConfidential: input.isConfidential ?? false,
      date: input.date || new Date().toISOString().split('T')[0],
    });

    const saved = await this.studentNotesRepository.save(note);

    return this.studentNotesRepository.findOneOrFail({
      where: { id: saved.id },
      relations: {
        authorMembership: { user: true },
      },
    });
  }

  async findNotesByStudentId(
    studentId: string,
    organizationId: string,
  ): Promise<StudentNote[]> {
    return this.studentNotesRepository.find({
      where: {
        studentId,
        organizationId,
        isActive: true,
      },
      relations: {
        authorMembership: { user: true },
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateNote(
    input: UpdateStudentNoteInput,
    organizationId: string,
  ): Promise<StudentNote> {
    const note = await this.studentNotesRepository.findOne({
      where: { id: input.id, organizationId, isActive: true },
    });

    if (!note) {
      throw new NotFoundException('Student note not found');
    }

    Object.assign(note, {
      ...(input.category !== undefined && { category: input.category }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.isConfidential !== undefined && {
        isConfidential: input.isConfidential,
      }),
      ...(input.date !== undefined && { date: input.date }),
    });

    await this.studentNotesRepository.save(note);

    return this.studentNotesRepository.findOneOrFail({
      where: { id: note.id },
      relations: {
        authorMembership: { user: true },
      },
    });
  }

  async softDeleteNote(
    id: string,
    organizationId: string,
  ): Promise<StudentNote> {
    const note = await this.studentNotesRepository.findOne({
      where: { id, organizationId, isActive: true },
    });

    if (!note) {
      throw new NotFoundException('Student note not found');
    }

    note.isActive = false;
    note.deletedAt = new Date();
    return this.studentNotesRepository.save(note);
  }
}
