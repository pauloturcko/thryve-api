import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { BankAccount } from "./bank-account";
import { InvestmentMovement } from "./investment-movement";
import { InvestmentStatusEnum } from "../enum/investment-status-enum";
import { IndexTypeEnum } from "../enum/index-type-enum";

@Entity("investments")
@Unique("UQ_investments_user_slug", ["userId", "slug"])
export class Investment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({name: "bank_account_id", type: "int"})
    bankAccountId: number;

    @Column({type: "varchar"})
    name: string;

    @Column({type: "varchar"})
    slug: string;

    @Column({name: "index_type", type: "int"})
    indexType: IndexTypeEnum;

    @Column({name: "index_percentage", type: "numeric", precision: 7, scale: 2, default: 100})
    indexPercentage: string;

    @Column({name: "spread_rate", type: "numeric", precision: 7, scale: 4, default: 0})
    spreadRate: string;

    @Column({name: "maturity_date", type: "date", nullable: true})
    maturityDate: string | null;

    @Column({type: "int", default: InvestmentStatusEnum.active})
    status: InvestmentStatusEnum;

    @Column({type: "text", nullable: true})
    notes: string | null;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;

    @ManyToOne(() => BankAccount, {onDelete: "RESTRICT"})
    @JoinColumn({name: "bank_account_id"})
    bankAccount: BankAccount;

    @OneToMany(() => InvestmentMovement, (movement) => movement.investment)
    movements: InvestmentMovement[];
}
