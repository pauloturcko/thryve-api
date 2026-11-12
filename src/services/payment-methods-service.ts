import { UserPaymentPreferencesRepository } from "../db/repository/user-payment-preferences-repository";
import { UsersRepository } from "../db/repository/users-repository";
import { NotFoundError, UnauthorizedError, ErrorCode } from "../errors";
import { togglePaymentPreferenceValidator } from "./validators/payment-methods-validator";

export class PaymentMethodsService {
    private userPaymentPreferencesRepository: UserPaymentPreferencesRepository;
    private userRepository: UsersRepository;
    

    constructor() {
        this.userPaymentPreferencesRepository = new UserPaymentPreferencesRepository()
        this.userRepository = new UsersRepository();
        
    }

    async getUserPreferences(userId: number) {
        const user = await this.userRepository.loadById(userId);
        
        if (!user) {
            throw new UnauthorizedError();
        }

        return await this.userPaymentPreferencesRepository.loadByUserId(userId)
    }

    async togglePreference(userId: number, data: unknown) {
        const {id: paymentMethodId} = togglePaymentPreferenceValidator.parse(data)

        const preference = await this.userPaymentPreferencesRepository.findByUserAndMethod(userId, paymentMethodId)

        if(!preference) {
            throw new NotFoundError(ErrorCode.paymentMethodNotFound, "Payment method not found")
        }

        preference.isActive = !preference.isActive

        return await this.userPaymentPreferencesRepository.save(preference)
    }
}
