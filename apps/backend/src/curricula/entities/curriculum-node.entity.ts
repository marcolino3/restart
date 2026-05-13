import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { ICurriculumNode } from '../interfaces/curriculum-node.interface';
import { Curriculum } from './curriculum.entity';
import { CurriculumLevel } from './curriculum-level.entity';
import { CurriculumNodeTranslation } from './curriculum-node-translation.entity';

@ObjectType()
@Entity('curriculum_nodes')
@Index('idx_curriculum_nodes_org', ['organizationId'])
@Index('idx_curriculum_nodes_curriculum', ['curriculumId'])
@Index('idx_curriculum_nodes_level', ['levelId'])
@Index('idx_curriculum_nodes_parent', ['parentId'])
export class CurriculumNode
  extends AbstractEntity<CurriculumNode>
  implements ICurriculumNode
{
  @Field(() => ID)
  @Column('uuid', { name: 'curriculum_id' })
  curriculumId: string;

  @ManyToOne(() => Curriculum, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum?: Curriculum;

  @Field(() => ID)
  @Column('uuid', { name: 'level_id' })
  levelId: string;

  @ManyToOne(() => CurriculumLevel)
  @JoinColumn({ name: 'level_id' })
  level?: CurriculumLevel;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => CurriculumNode, (n) => n.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: CurriculumNode | null;

  @Field(() => [CurriculumNode], { nullable: true })
  @OneToMany(() => CurriculumNode, (n) => n.parent)
  children?: CurriculumNode[];

  @Field(() => CurriculumNodeType)
  @Column('enum', { enum: CurriculumNodeType, name: 'node_type' })
  nodeType: CurriculumNodeType;

  @Field(() => Int)
  @Column('int', { default: 0 })
  position: number;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => [CurriculumNodeTranslation], { nullable: true })
  @OneToMany(() => CurriculumNodeTranslation, (t) => t.curriculumNode, {
    cascade: false,
  })
  translations?: CurriculumNodeTranslation[];
}
