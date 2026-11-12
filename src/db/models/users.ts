import {Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Cards} from "./cards";
import { UserPaymentPreferences } from "./user-payment-preferences";
import { UserSystemPreferences } from "./user-system-preferences";
import { Category } from "./category";
import { BankAccount } from "./bank-account";

@Entity('users')
export class Users {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar'})
    name: string;

    @Column({type: 'varchar', unique: true})
    email: string;

    @Column({type: 'varchar', select: false})
    password: string;

    @Column({nullable: true, type: 'varchar', name: 'profile_picture'})
    profilePicture: string | null;

    @CreateDateColumn({type: 'timestamp', name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({type: 'timestamp', name: 'updated_at'})
    updatedAt: Date;

    @OneToMany(() => Cards, (cards) => cards.owner)
    cards: Cards[];

    @OneToMany(() => UserPaymentPreferences, (pref) => pref.user)
    paymentPreferences: UserPaymentPreferences[];

    @OneToOne(() => UserSystemPreferences, (pref) => pref.user)
    systemPreferences: UserSystemPreferences;

    @OneToMany(() => Category, (category) => category.owner)
    categories: Category[];

    @OneToMany(() => BankAccount, (bankAccount) => bankAccount.owner)
    bankAccounts: BankAccount[];
}