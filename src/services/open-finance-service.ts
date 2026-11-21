import { Item, PluggyClient } from "pluggy-sdk";
import { OpenFinanceItem } from "../db/models/open-finance-item";
import { OpenFinanceItemRepository } from "../db/repository/open-finance-item-repository";
import { UsersRepository } from "../db/repository/users-repository";
import { AppError, ErrorCode, ForbiddenError, NotFoundError } from "../errors";
import { connectTokenValidator, registerItemValidator } from "./validators/open-finance-validator";

let pluggyClient: PluggyClient | null = null;

const getPluggyClient = (): PluggyClient => {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new AppError(ErrorCode.openFinanceNotConfigured, "Open Finance não está configurado no servidor.");
    }

    pluggyClient ??= new PluggyClient({clientId, clientSecret});
    return pluggyClient;
};

type PluggyErrorBody = {code?: number, message?: string};

const isNotFound = (error: unknown) => (error as PluggyErrorBody | null)?.code === 404;

const providerError = (action: string, error: unknown) => {
    console.error(`Falha no Pluggy ao ${action}`, error);
    return new AppError(ErrorCode.openFinanceProviderError, "Não foi possível falar com o provedor de Open Finance.");
};

export class OpenFinanceService {
    private itemRepository = new OpenFinanceItemRepository();
    private usersRepository = new UsersRepository();

    async createConnectToken(userId: number, data: unknown): Promise<{accessToken: string}> {
        const {itemId} = connectTokenValidator.parse(data);
        if (itemId) await this.loadOwnedItem(userId, itemId);

        const client = getPluggyClient();
        try {
            const {accessToken} = await client.createConnectToken(itemId, {
                clientUserId: String(userId),
                avoidDuplicates: true,
                webhookUrl: process.env.PLUGGY_WEBHOOK_URL || undefined,
            });
            return {accessToken};
        } catch (error) {
            throw providerError("criar o connect token", error);
        }
    }

    async registerItem(userId: number, data: unknown): Promise<OpenFinanceItem> {
        const {itemId} = registerItemValidator.parse(data);
        const item = await this.fetchPluggyItem(itemId);

        if (item.clientUserId !== String(userId)) throw new ForbiddenError();

        const existing = await this.itemRepository.findByItemId(itemId);
        if (existing && existing.userId !== userId) throw new ForbiddenError();

        return await this.itemRepository.save({
            userId,
            itemId: item.id,
            connectorName: item.connector.name,
            connectorImageUrl: item.connector.imageUrl ?? null,
            status: item.status,
        });
    }

    async syncItem(itemId: string): Promise<OpenFinanceItem | null> {
        const item = await this.fetchPluggyItem(itemId);
        const userId = Number(item.clientUserId);
        if (!Number.isInteger(userId) || userId <= 0 || !(await this.usersRepository.loadById(userId))) {
            console.warn(`Item ${itemId} do Pluggy sem usuário válido no Thryve (clientUserId: ${item.clientUserId})`);
            return null;
        }

        const existing = await this.itemRepository.findByItemId(itemId);
        if (existing && existing.userId !== userId) {
            console.warn(`Item ${itemId} do Pluggy mudou de usuário (${existing.userId} -> ${userId}); ignorado`);
            return null;
        }

        return await this.itemRepository.save({
            userId,
            itemId: item.id,
            connectorName: item.connector.name,
            connectorImageUrl: item.connector.imageUrl ?? null,
            status: item.status,
        });
    }

    async removeItem(itemId: string): Promise<void> {
        await this.itemRepository.deleteByItemId(itemId);
    }

    async loadAll(userId: number): Promise<OpenFinanceItem[]> {
        return await this.itemRepository.loadAll(userId);
    }

    private async fetchPluggyItem(itemId: string): Promise<Item> {
        const client = getPluggyClient();
        try {
            return await client.fetchItem(itemId);
        } catch (error) {
            if (isNotFound(error)) {
                throw new NotFoundError(ErrorCode.openFinanceItemNotFound, "Open Finance item does not exist!");
            }
            throw providerError("buscar o item", error);
        }
    }

    private async loadOwnedItem(userId: number, itemId: string): Promise<OpenFinanceItem> {
        const item = await this.itemRepository.findByItemId(itemId);
        if (!item) throw new NotFoundError(ErrorCode.openFinanceItemNotFound, "Open Finance item does not exist!");
        if (item.userId !== userId) throw new ForbiddenError();

        return item;
    }
}
