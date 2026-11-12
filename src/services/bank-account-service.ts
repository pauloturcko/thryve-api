import { BankAccount } from "../db/models/bank-account";
import { BankAccountRepository } from "../db/repository/bank-account-repository";
import { TransactionRepository } from "../db/repository/transaction-repository";
import { ForbiddenError, GenericError, NotFoundError, ErrorCode } from "../errors";
import { slugify } from "../utils/slugify";
import { createBankAccountValidator, deleteBankAccountValidator, updateBankAccountValidator } from "./validators/bank-account-validator";

export class BankAccountService {
    private bankAccountRepository = new BankAccountRepository();
    private transactionRepository = new TransactionRepository();

    async create(userId: number, data: unknown) {
        const {name, accountType, balance} = createBankAccountValidator.parse(data)

        const slug = slugify(name)

        const existingBankAccount = await this.bankAccountRepository.findByUnique({
            userId,
            slug,
            accountType
        })

        if (existingBankAccount) {
            throw new GenericError(ErrorCode.bankAccountAlreadyExists, "This bank account already exists!")
        }

        return await this.bankAccountRepository.create({
            userId,
            name,
            slug,
            accountType,
            balance
        })
    }

    async loadAll(userId: number): Promise<BankAccount[]> {
        return await this.bankAccountRepository.loadAll(userId)
    }

    async update(userId: number, data: unknown): Promise<BankAccount> {
        const parsedData = updateBankAccountValidator.parse(data)

        const bankAccount = await this.bankAccountRepository.loadById(parsedData.id)
        if(!bankAccount) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!")
        if(bankAccount.userId !== userId) throw new ForbiddenError();

        const updatedBankAccountData = {
            ...bankAccount,
            ...parsedData,
            slug: slugify(parsedData.name ?? bankAccount.name)
        }

        const existingBankAccount = await this.bankAccountRepository.findByUnique({
            userId,
            slug: updatedBankAccountData.slug,
            accountType: updatedBankAccountData.accountType
        })

        if(existingBankAccount && existingBankAccount.id !== bankAccount.id) {
            throw new GenericError(ErrorCode.bankAccountAlreadyExists, "This bank account already exists!")
        }

        return await this.bankAccountRepository.update(updatedBankAccountData)
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = deleteBankAccountValidator.parse(data)

        const bankAccount = await this.bankAccountRepository.loadById(id)
        if(!bankAccount) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!")
        if(bankAccount.userId !== userId) throw new ForbiddenError();
        if(await this.transactionRepository.existsWhere({bankAccountId: id})) {
            throw new GenericError(ErrorCode.bankAccountHasTransactions, "This bank account has transactions and cannot be deleted!")
        }

        return await this.bankAccountRepository.delete(id)
    }
}