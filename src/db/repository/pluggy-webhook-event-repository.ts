import { Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { PluggyWebhookEvent } from "../models/pluggy-webhook-event";
import { appDataSource } from "../config/data-source";

type NewWebhookEvent = {
    eventId: string,
    event: string,
    itemId: string | null,
    payload: Record<string, unknown>,
}

export class PluggyWebhookEventRepository {
    private repository: Repository<PluggyWebhookEvent>

    constructor() {
        this.repository = appDataSource.getRepository(PluggyWebhookEvent)
    }

    async insertIfNew(data: NewWebhookEvent): Promise<number | null> {
        const result = await this.repository
            .createQueryBuilder()
            .insert()
            .values(data as QueryDeepPartialEntity<PluggyWebhookEvent>)
            .orIgnore()
            .returning(["id"])
            .execute()

        return (result.raw as {id: number}[])[0]?.id ?? null
    }

    async markProcessed(id: number, error: string | null = null): Promise<void> {
        await this.repository.update({id}, {processedAt: new Date(), error})
    }
}
