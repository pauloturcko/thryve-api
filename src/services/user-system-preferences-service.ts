import { UserSystemPreferencesRepository } from "../db/repository/user-system-preferences-repository";
import { UserSystemPreferences } from "../db/DTO/user-system-preferences";
import { NotFoundError, ErrorCode } from "../errors";
import { updateSystemPreferencesValidator } from "./validators/system-preferences-validators";

export class UserSystemPreferencesService {
    private userSystemPreferencesRepository: UserSystemPreferencesRepository

    constructor() {
        this.userSystemPreferencesRepository = new UserSystemPreferencesRepository()
    }

    async updatePreference(userId: number, data: unknown): Promise<UserSystemPreferences> {
        const parsedData = updateSystemPreferencesValidator.parse(data)

        const preference = await this.userSystemPreferencesRepository.loadByUserId(userId)
        if (!preference) {
            throw new NotFoundError(ErrorCode.preferencesNotFound, "Preferences not found")
        }

        Object.assign(preference, parsedData)

        const saved = await this.userSystemPreferencesRepository.save(preference)

        return {
            theme: saved.theme,
            language: saved.language,
            currency: saved.currency,
        }
    }
}