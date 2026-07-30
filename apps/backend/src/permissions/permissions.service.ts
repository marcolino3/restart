import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, In, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionCode } from './entities/permission-code.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepo.find({ order: { code: 'ASC' } });
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    if (!codes || codes.length === 0) return [];
    // typeorm's `In()` helper is declared to always return
    // `FindOperator<any>` regardless of the generic argument, so a cast is
    // unavoidable to recover the concrete element type.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- typeorm In() is typed FindOperator<any>
    const codeFilter: FindOperator<PermissionCode> = In(
      codes as PermissionCode[],
    );
    return this.permissionRepo.find({ where: { code: codeFilter } });
  }
}
