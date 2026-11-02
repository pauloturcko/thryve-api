import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { Category } from "./category";
import { BankAccount } from "./bank-account";
import { PaymentMethods } from "./payment-methods";
import { Cards } from "./cards";
import { TransactionTypeEnum } from "../enum/transaction-type-enum";
import { IncomeKindEnum } from "../enum/income-kind-enum";
import { TransactionStatusEnum } from "../enum/transaction-status-enum";
import { ExpenseKindEnum } from "../enum/expense-kind-enum";

@Entity("transactions")
@Index("IDX_transactions_user_date", ["userId", "date"])
export class Transaction {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "int"})
    type: TransactionTypeEnum;

    @Column({name: "income_kind", type: "int", nullable: true})
    incomeKind: IncomeKindEnum | null;

    @Column({name: "expense_kind", type: "int", nullable: true})
    expenseKind: ExpenseKindEnum | null;

    @Column({type: "varchar", nullable: true})
    description: string | null;

    @Column({name: "due_date", type: "date", nullable: true})
    dueDate: string | null;

    @Column({type: "numeric", precision: 12, scale: 2})
    amount: string;

    @Column({type: "date"})
    date: string;

    @Column({type: "int"})
    status: TransactionStatusEnum;

    @Column({name: "category_id", type: "int"})
    categoryId: number;

    @Column({name: "bank_account_id", type: "int"})
    bankAccountId: number;

    @Column({name: "payment_method_id", type: "int", nullable: true})
    paymentMethodId: number | null;

    @Column({name: "card_id", type: "int", nullable: true})
    cardId: number | null;

    @Column({type: "varchar", nullable: true})
    source: string | null;

    @Column({type: "text", nullable: true})
    notes: string | null;

    @Column({name: "linked_transaction_id", type: "int", nullable: true})
    linkedTransactionId: number | null;

    @Column({name: "installment_group_id", type: "uuid", nullable: true})
    installmentGroupId: string | null;

    @Column({name: "installment_number", type: "int", nullable: true})
    installmentNumber: number | null;

    @Column({name: "installment_total", type: "int", nullable: true})
    installmentTotal: number | null;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;

    @ManyToOne(() => Category, {onDelete: "RESTRICT"})
    @JoinColumn({name: "category_id"})
    category: Category;

    @ManyToOne(() => BankAccount, {onDelete: "RESTRICT"})
    @JoinColumn({name: "bank_account_id"})
    bankAccount: BankAccount | null;

    @ManyToOne(() => PaymentMethods, {onDelete: "RESTRICT"})
    @JoinColumn({name: "payment_method_id"})
    paymentMethod: PaymentMethods | null;

    @ManyToOne(() => Cards, {onDelete: "RESTRICT"})
    @JoinColumn({name: "card_id"})
    card: Cards | null;

    @ManyToOne(() => Transaction, {onDelete: "RESTRICT"})
    @JoinColumn({name: "linked_transaction_id"})
    linkedTransaction: Transaction | null;
}
