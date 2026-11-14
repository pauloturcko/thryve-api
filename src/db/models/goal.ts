import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { GoalPriorityEnum } from "../enum/goal-priority-enum";
import { GoalStatusEnum } from "../enum/goal-status-enum";

@Entity("goals")
@Unique("UQ_goals_user_slug", ["userId", "slug"])
export class Goal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "varchar"})
    name: string;

    @Column({type: "varchar"})
    slug: string;

    @Column({name: "target_amount", type: "numeric", precision: 12, scale: 2, nullable: true})
    targetAmount: string | null;

    @Column({name: "saved_amount", type: "numeric", precision: 12, scale: 2, default: 0})
    savedAmount: string;

    @Column({type: "int"})
    priority: GoalPriorityEnum;

    @Column({type: "int", default: GoalStatusEnum.pending})
    status: GoalStatusEnum;

    @Column({type: "date", nullable: true})
    deadline: string | null;

    @Column({name: "completed_at", type: "date", nullable: true})
    completedAt: string | null;

    @Column({type: "text", nullable: true})
    notes: string | null;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;
}
