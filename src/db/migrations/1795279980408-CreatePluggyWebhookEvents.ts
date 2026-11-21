import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePluggyWebhookEvents1795279980408 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "pluggy_webhook_events",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "event_id", type: "varchar"},
                {name: "event", type: "varchar"},
                {name: "item_id", type: "uuid", isNullable: true},
                {name: "payload", type: "jsonb"},
                {name: "received_at", type: "timestamp", default: "now()"},
                {name: "processed_at", type: "timestamp", isNullable: true},
                {name: "error", type: "text", isNullable: true},
            ],
            indices: [
                new TableIndex({name: "UQ_pluggy_webhook_events_event_id", columnNames: ["event_id"], isUnique: true}),
                new TableIndex({name: "IDX_pluggy_webhook_events_item", columnNames: ["item_id"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("pluggy_webhook_events");
    }

}
