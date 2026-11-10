import {CardsRepository} from "../db/repository/cards-repository";
import {TransactionRepository} from "../db/repository/transaction-repository";
import {
    cardHasCredit,
    createCardValidator,
    deleteCardValidator,
    limitRequiredMessage,
    updateCardValidator,
} from "./validators/card-validator";
import {BusinessRuleError, GenericError, NotFoundError, ForbiddenError} from "../errors";
import {Cards} from "../db/models/cards";
import {slugify} from "../utils/slugify";

export class CardsService {
    private cardsRepository = new CardsRepository();
    private transactionRepository = new TransactionRepository();

    async create(userId: number, data: unknown) {
        const {name, limit, cardType, cardFlag, expiresIn, lastFourDigits} =
            createCardValidator.parse(data);

        const slug = slugify(name);

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            slug,
            lastFourDigits,
        });

        if (existingCard) {
            throw new GenericError('This card already exists!');
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
        });
    }

    async loadAll(userId: number): Promise<Cards[]> {
        return await this.cardsRepository.loadAll(userId);
    }

    async update(userId: number, data: unknown): Promise<Cards> {
        const parsedData = updateCardValidator.parse(data);

        const card = await this.cardsRepository.loadById(parsedData.id);
        if (!card) throw new NotFoundError('Card does not exist!');
        if (card.userId !== userId) throw new ForbiddenError();

        const updatedCardData = {
            ...card,
            ...parsedData,
            slug: slugify(parsedData.name ?? card.name),
        };

        if (!cardHasCredit(updatedCardData.cardType)) {
            updatedCardData.limit = null;
        } else if (updatedCardData.limit == null) {
            throw new BusinessRuleError(limitRequiredMessage);
        }

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            slug: updatedCardData.slug,
            lastFourDigits: updatedCardData.lastFourDigits,
        });

        if (existingCard && existingCard.id !== card.id) {
            throw new GenericError('This card already exists!');
        }

        return await this.cardsRepository.update(updatedCardData);
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = deleteCardValidator.parse(data);

        const card = await this.cardsRepository.loadById(id);
        if (!card) throw new NotFoundError('Card does not exist!');
        if (card.userId !== userId) throw new ForbiddenError();
        if (await this.transactionRepository.existsWhere({cardId: id})) {
            throw new GenericError('This card has transactions and cannot be deleted!');
        }

        return await this.cardsRepository.delete(id);
    }
}
