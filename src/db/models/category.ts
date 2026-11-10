import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { CategoryTypeEnum } from "../enum/category-type-enum";

@Entity('category')
@Unique("UQ_category_user_slug", ["userId", "slug"])
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "varchar"})
    name: string;

    @Column({type: "varchar"})
    slug: string;

    @Column({type: "varchar", length: 50})
    icon: string;

    @Column({type: "varchar", length: 7})
    color: string;

    @Column({type: "int"})
    type: CategoryTypeEnum;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;
}