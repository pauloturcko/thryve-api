import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("pluggy_webhook_events")
export class PluggyWebhookEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Index("UQ_pluggy_webhook_events_event_id", {unique: true})
    @Column({name: "event_id", type: "varchar"})
    eventId: string;

    @Column({type: "varchar"})
    event: string;

    @Column({name: "item_id", type: "uuid", nullable: true})
    itemId: string | null;

    @Column({type: "jsonb"})
    payload: Record<string, unknown>;

    @CreateDateColumn({name: "received_at", type: "timestamp"})
    receivedAt: Date;

    @Column({name: "processed_at", type: "timestamp", nullable: true})
    processedAt: Date | null;

    @Column({name: "error", type: "text", nullable: true})
    error: string | null;
}
