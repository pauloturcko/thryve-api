import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users";
import { ExpenseKindEnum } from "../enum/expense-kind-enum";

// Gasto falado no app que ainda não virou lançamento. Fica fora de `transactions` para não mexer em saldo,
// relatórios nem listagens até o usuário revisar e confirmar. Qualquer campo pode faltar: a fala nem sempre diz tudo.
@Entity("expense_drafts")
@Index("IDX_expense_drafts_user_created", ["userId", "createdAt"])
export class ExpenseDraft {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "text"})
    transcript: string;

    @Column({type: "varchar", nullable: true})
    description: string | null;

    @Column({type: "numeric", precision: 12, scale: 2, nullable: true})
    amount: string | null;

    @Column({type: "date", nullable: true})
    date: string | null;

    @Column({name: "expense_kind", type: "int", nullable: true})
    expenseKind: ExpenseKindEnum | null;

    @Column({name: "category_id", type: "int", nullable: true})
    categoryId: number | null;

    @Column({name: "bank_account_id", type: "int", nullable: true})
    bankAccountId: number | null;

    @Column({name: "payment_method_id", type: "int", nullable: true})
    paymentMethodId: number | null;

    @Column({name: "card_id", type: "int", nullable: true})
    cardId: number | null;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;
}
