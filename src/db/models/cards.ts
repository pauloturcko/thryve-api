import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn} from "typeorm";
import {Users} from "./users";

@Entity("cards")
@Unique("UQ_cards_user_slug_last_four_digits", ["userId", "slug", "lastFourDigits"])
export class Cards {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({type: "varchar"})
    name: string;

    @Column({type: "varchar"})
    slug: string;

    @Column({type: "numeric", precision: 12, scale: 2, nullable: true})
    limit: string | null;

    @Column({name: "card_type", type: "int"})
    cardType: number;

    @Column({name: "card_flag", type: "int"})
    cardFlag: number;

    @Column({name: "expires_in", type: "date"})
    expiresIn: Date;

    @Column({name: "last_four_digits", type: "char", length: 4})
    lastFourDigits: string;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, (cards) => cards.cards, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users
}