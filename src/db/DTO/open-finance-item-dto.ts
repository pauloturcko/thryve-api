export interface SaveOpenFinanceItemDto {
    userId: number;
    itemId: string;
    connectorName: string;
    connectorImageUrl: string | null;
    status: string;
}
