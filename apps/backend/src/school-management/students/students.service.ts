import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { AdmissionStage } from '../admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '../admission-stages/enums/admission-stage-type.enum';
import { AdmissionStagesService } from '../admission-stages/admission-stages.service';
import { Student } from './entities/student.entity';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(AdmissionStage)
    private readonly stagesRepo: Repository<AdmissionStage>,
    private readonly admissionStagesService: AdmissionStagesService,
  ) {}

  async create(
    input: CreateStudentInput,
    organizationId: string,
  ): Promise<Student> {
    let admissionStageId = input.admissionStageId ?? null;
    if (!admissionStageId) {
      const defaultStage =
        await this.admissionStagesService.findDefault(organizationId);
      admissionStageId = defaultStage?.id ?? null;
    }
    const student = this.studentRepo.create({
      ...input,
      admissionStageId,
      organizationId,
    });
    const saved = await this.studentRepo.save(student);
    return this.findOne(saved.id, organizationId);
  }

  async findAllByOrgId(organizationId: string): Promise<Student[]> {
    return this.studentRepo.find({
      where: { organizationId, isActive: true },
      relations: ['admissionStage'],
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id, organizationId, isActive: true },
      relations: ['admissionStage'],
    });
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    return student;
  }

  async update(
    input: UpdateStudentInput,
    organizationId: string,
  ): Promise<Student> {
    const student = await this.findOne(input.id, organizationId);
    Object.assign(student, input);
    await this.studentRepo.save(student);
    return this.findOne(input.id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const student = await this.findOne(id, organizationId);
    student.isActive = false;
    await this.studentRepo.save(student);
    return true;
  }

  async moveToStage(
    studentId: string,
    stageId: string,
    organizationId: string,
  ): Promise<Student> {
    const student = await this.findOne(studentId, organizationId);
    const stage = await this.stagesRepo.findOne({
      where: { id: stageId, organizationId },
    });
    if (!stage) {
      throw new NotFoundException(`Admission stage ${stageId} not found`);
    }

    student.admissionStageId = stage.id;
    if (
      stage.stageType === AdmissionStageType.ENROLLED &&
      !student.enrollmentDate
    ) {
      student.enrollmentDate = DateTime.now().toISODate();
    }

    await this.studentRepo.save(student);
    return this.findOne(studentId, organizationId);
  }
}
