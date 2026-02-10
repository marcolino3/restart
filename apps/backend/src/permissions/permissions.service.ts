import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

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
    if (codes.length === 0) return [];
    return this.permissionRepo.find({ where: { code: In(codes) as any } });
  }
}
