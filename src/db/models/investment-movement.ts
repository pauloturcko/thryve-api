import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { Investment } from "./investment";
import { InvestmentMovementTypeEnum } from "../enum/investment-movement-type-enum";

@Entity("investment_movements")
@Index("IDX_investment_movements_user_date", ["userId", "date"])
@Index("IDX_investment_movements_investment_date", ["investmentId", "date"])
export class InvestmentMovement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({name: "investment_id", type: "int"})
    investmentId: number;

    @Column({type: "int"})
    type: InvestmentMovementTypeEnum;

    @Column({type: "numeric", precision: 12, scale: 2})
    amount: string;

    @Column({type: "date"})
    date: string;

    @Column({type: "text", nullable: true})
    notes: string | null;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;

    @ManyToOne(() => Investment, (investment) => investment.movements, {onDelete: "CASCADE"})
    @JoinColumn({name: "investment_id"})
    investment: Investment;
}
