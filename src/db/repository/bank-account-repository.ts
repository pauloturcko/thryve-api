import { EntityManager, Repository } from "typeorm";
import { BankAccount } from "../models/bank-account";
import { appDataSource } from "../config/data-source";
import { CreateBankAccountDto, UpdateBankAccountDto } from "../DTO/bank-account-dto";

type UniqueBankAccount = {
    userId: number,
    name: string,
    accountType: number,
}
// TODO: Revisar todos os repositories e remover tipagens locais

export class BankAccountRepository {
    private repository: Repository<BankAccount>
    
    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(BankAccount)
    }

    async create(data: CreateBankAccountDto) {
        return await this.repository.save(data)
    }

    async findByUnique({userId, name, accountType}: UniqueBankAccount) {
        return this.repository.findOne({
            where: {
                userId,
                name,
                accountType
            }
        })
    }

    async loadAll(userId: number): Promise<BankAccount[]> {
        return await this.repository.find({where: {userId}})
    }

    async loadById(id: number): Promise<BankAccount | null> {
        return await this.repository.findOne({where: {id}})
    }

    async update(data: UpdateBankAccountDto) {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }

    async adjustBalance(id: number, delta: number): Promise<void> {
        await this.repository.increment({id}, "balance", delta)
    }
}