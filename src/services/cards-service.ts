import {CardsRepository} from "../db/repository/cards-repository";
import {TransactionRepository} from "../db/repository/transaction-repository";
import {
    cardHasCredit,
    createCardValidator,
    deleteCardValidator,
    limitRequiredMessage,
    updateCardValidator,
} from "./validators/card-validator";
import {BusinessRuleError, GenericError, NotFoundError, ForbiddenError, ErrorCode} from "../errors";
import {Cards} from "../db/models/cards";
import {BankAccountRepository} from "../db/repository/bank-account-repository";
import {CardLimitSummary, summarizeLimit} from "./card-limit";
import {slugify} from "../utils/slugify";

export class CardsService {
    private cardsRepository = new CardsRepository();
    private transactionRepository = new TransactionRepository();
    private bankAccountRepository = new BankAccountRepository();

    async create(userId: number, data: unknown) {
        const {name, limit, cardType, cardFlag, expiresIn, lastFourDigits, bankAccountId} =
            createCardValidator.parse(data);
        if (bankAccountId) await this.ensureOwnedAccount(userId, bankAccountId);

        const slug = slugify(name);

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            slug,
            lastFourDigits,
        });

        if (existingCard) {
            throw new GenericError(ErrorCode.cardAlreadyExists, 'This card already exists!');
        }

        return await this.cardsRepository.create({
            userId,
            name,
            slug,
            cardType,
            limit,
            cardFlag,
            expiresIn,
            lastFourDigits,
            bankAccountId: bankAccountId ?? null,
        });
    }

    async loadAll(userId: number): Promise<(Cards & CardLimitSummary)[]> {
        const [cards, usedByCard] = await Promise.all([
            this.cardsRepository.loadAll(userId),
            this.transactionRepository.sumPendingCreditByCard(userId),
        ]);

        return cards.map((card) => ({...card, ...summarizeLimit(card, usedByCard.get(card.id) ?? 0)}));
    }

    async update(userId: number, data: unknown): Promise<Cards> {
        const parsedData = updateCardValidator.parse(data);

        const card = await this.cardsRepository.loadById(parsedData.id);
        if (!card) throw new NotFoundError(ErrorCode.cardNotFound, 'Card does not exist!');
        if (card.userId !== userId) throw new ForbiddenError();
        if (parsedData.bankAccountId) await this.ensureOwnedAccount(userId, parsedData.bankAccountId);

        const updatedCardData = {
            ...card,
            ...parsedData,
            slug: slugify(parsedData.name ?? card.name),
        };

        if (!cardHasCredit(updatedCardData.cardType)) {
            updatedCardData.limit = null;
        } else if (updatedCardData.limit == null) {
            throw new BusinessRuleError(ErrorCode.cardLimitRequired, limitRequiredMessage);
        }

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            slug: updatedCardData.slug,
            lastFourDigits: updatedCardData.lastFourDigits,
        });

        if (existingCard && existingCard.id !== card.id) {
            throw new GenericError(ErrorCode.cardAlreadyExists, 'This card already exists!');
        }

        const {bankAccount: _bankAccount, ...cardFields} = updatedCardData;
        return await this.cardsRepository.update(cardFields);
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = deleteCardValidator.parse(data);

        const card = await this.cardsRepository.loadById(id);
        if (!card) throw new NotFoundError(ErrorCode.cardNotFound, 'Card does not exist!');
        if (card.userId !== userId) throw new ForbiddenError();
        if (await this.transactionRepository.existsWhere({cardId: id})) {
            throw new GenericError(ErrorCode.cardHasTransactions, 'This card has transactions and cannot be deleted!');
        }

        return await this.cardsRepository.delete(id);
    }

    private async ensureOwnedAccount(userId: number, bankAccountId: number): Promise<void> {
        const account = await this.bankAccountRepository.loadById(bankAccountId);
        if (!account) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!");
        if (account.userId !== userId) throw new ForbiddenError();
    }
}
