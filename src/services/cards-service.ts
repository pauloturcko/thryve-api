import {CardsRepository} from "../db/repository/cards-repository";
import {TransactionRepository} from "../db/repository/transaction-repository";
import {createCardValidator, deleteCardValidator, updateCardValidator} from "./validators/card-validator";
import {GenericError, NotFoundError, ForbiddenError} from "../errors";
import {Cards} from "../db/models/cards";

export class CardsService {
    private cardsRepository = new CardsRepository();
    private transactionRepository = new TransactionRepository();

    async create(userId: number, data: unknown) {
        const {name, limit, cardType, cardFlag, expiresIn, lastFourDigits} =
            createCardValidator.parse(data);

        const normalizedName = name.trim().toLowerCase();

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            name: normalizedName,
            lastFourDigits,
        });

        if (existingCard) {
            throw new GenericError('This card already exists!');
        }

        return await this.cardsRepository.create({
            userId,
            name: normalizedName,
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

        if (parsedData.name) {
            parsedData.name = parsedData.name.trim().toLowerCase();
        }

        const updatedCardData = {
            ...card,
            ...parsedData
        };

        const existingCard = await this.cardsRepository.findByUniqueFields({
            userId,
            name: updatedCardData.name,
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
