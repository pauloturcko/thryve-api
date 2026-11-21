import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./users";

@Entity("open_finance_items")
export class OpenFinanceItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Index("UQ_open_finance_items_item_id", {unique: true})
    @Column({name: "item_id", type: "uuid"})
    itemId: string;

    @Column({name: "connector_name", type: "varchar"})
    connectorName: string;

    @Column({name: "connector_image_url", type: "varchar", nullable: true})
    connectorImageUrl: string | null;

    @Column({type: "varchar"})
    status: string;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @UpdateDateColumn({name: "updated_at", type: "timestamp"})
    updatedAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;
}
