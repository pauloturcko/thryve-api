import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Users } from "./users";

@Unique("UQ_bank_account_user_slug_account_type", ["userId", "slug", "accountType"])
@Entity("bank_account")
export class BankAccount {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "varchar"})
    name: string;

    @Column({type: "varchar"})
    slug: string;

    @Column({type: "int", name: "account_type"})
    accountType: number;

    @Column({type: "numeric", precision: 12, scale: 2, default: 0})
    balance: string;
    // O TypeORM devolve type: "numerci" como string, se tipar como number perderia a precisao na conversao

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users
}   