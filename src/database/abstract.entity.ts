import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { IBase } from './interfaces/base.interface';

@ObjectType({ isAbstract: true })
export class AbstractEntity<T> implements IBase {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @VersionColumn()
  version: number;

  @Field(() => Boolean)
  @Column('boolean', { default: true })
  isActive: boolean;

  @Field(() => Boolean)
  @Column('boolean', { default: false })
  isArchived: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('date', { nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<T>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
