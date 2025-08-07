import { Injectable } from '@nestjs/common';
import { CreatePermissionInput } from './dto/create-permission.input';
import { UpdatePermissionInput } from './dto/update-permission.input';

@Injectable()
export class PermissionsService {
  create(createPermissionInput: CreatePermissionInput) {
    return 'This action adds a new permission';
  }

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(updatePermissionInput: UpdatePermissionInput) {
    console.log(updatePermissionInput);
    return `This action updates a #${updatePermissionInput} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
