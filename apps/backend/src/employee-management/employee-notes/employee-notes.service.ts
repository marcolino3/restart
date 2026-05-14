import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeNote } from './entities/employee-note.entity';
import { CreateEmployeeNoteInput } from './dto/create-employee-note.input';
import { UpdateEmployeeNoteInput } from './dto/update-employee-note.input';

@Injectable()
export class EmployeeNotesService {
  constructor(
    @InjectRepository(EmployeeNote)
    private readonly employeeNotesRepository: Repository<EmployeeNote>,
  ) {}

  async createNote(
    input: CreateEmployeeNoteInput,
    authorMembershipId: string | undefined,
    organizationId: string,
  ): Promise<EmployeeNote> {
    const note = this.employeeNotesRepository.create({
      ...input,
      authorMembershipId: authorMembershipId || null,
      organizationId,
      isConfidential: input.isConfidential ?? false,
      date: input.date || new Date().toISOString().split('T')[0],
    });

    const saved = await this.employeeNotesRepository.save(note);

    return this.employeeNotesRepository.findOneOrFail({
      where: { id: saved.id },
      relations: {
        authorMembership: { user: true },
      },
    });
  }

  async findNotesByEmployeeId(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeNote[]> {
    return this.employeeNotesRepository.find({
      where: {
        employeeId,
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
    input: UpdateEmployeeNoteInput,
    organizationId: string,
  ): Promise<EmployeeNote> {
    const note = await this.employeeNotesRepository.findOne({
      where: { id: input.id, organizationId, isActive: true },
    });

    if (!note) {
      throw new NotFoundException('Employee note not found');
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

    await this.employeeNotesRepository.save(note);

    return this.employeeNotesRepository.findOneOrFail({
      where: { id: note.id },
      relations: {
        authorMembership: { user: true },
      },
    });
  }

  async softDeleteNote(
    id: string,
    organizationId: string,
  ): Promise<EmployeeNote> {
    const note = await this.employeeNotesRepository.findOne({
      where: { id, organizationId, isActive: true },
    });

    if (!note) {
      throw new NotFoundException('Employee note not found');
    }

    note.isActive = false;
    note.deletedAt = new Date();
    return this.employeeNotesRepository.save(note);
  }
}
