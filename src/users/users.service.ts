import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { EntityManager } from 'typeorm';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly entityManager: EntityManager) {}

  async create(createUserInput: CreateUserInput) {
    const { email, password: plainPassword, ...rest } = createUserInput;
    const existingUser = await this.entityManager.findOneBy(User, { email });

    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await hash(plainPassword, 10);

    const user = this.entityManager.create(User, {
      ...rest,
      email,
      password: hashedPassword,
    });

    return this.entityManager.save(user);
  }

  async findAll() {
    return this.entityManager.find(User);
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  findOneByEmail(email: string) {
    return this.entityManager.findOneByOrFail(User, { email });
  }

  async update(updateUserInput: UpdateUserInput) {
    const { id } = updateUserInput;
    return this.entityManager.transaction(async (manager) => {
      const user = await this.entityManager.findOneOrFail(User, {
        where: { id },
        relations: ['roles'],
      });

      // Todo: RelationsUpdates

      manager.merge(User, user, updateUserInput);
      return manager.save(user);
    });
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
