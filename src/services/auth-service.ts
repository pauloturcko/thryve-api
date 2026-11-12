import {authValidator} from "./validators/auth-validator";
import {verifyPassword} from "../utils/hash-password";
import {generateToken} from "../utils/jwt";
import {UsersRepository} from "../db/repository/users-repository";
import {UsersService} from "./users-service";
import {UnauthorizedError, ErrorCode} from "../errors";

export class AuthService {
    private userRepository: UsersRepository;
    private usersService: UsersService;

    constructor() {
        this.userRepository = new UsersRepository();
        this.usersService = new UsersService();
    }

    async authentication(data: unknown) {
        const {email, password} = authValidator.parse(data);

        const user = await this.userRepository.loadByEmail(email);
        if (!user) {
            throw new UnauthorizedError(ErrorCode.invalidCredentials);
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError(ErrorCode.invalidCredentials);
        }

        const token = generateToken(user.id);
        const loggedUser = await this.usersService.getLoggedUser(user.id);

        return {
            token,
            user: {
                id: loggedUser.user.id,
                name: loggedUser.user.name,
                email: loggedUser.user.email,
                createdAt: loggedUser.user.createdAt,
                profilePicture: loggedUser.user.profilePicture,
            },
            systemPreferences: loggedUser.systemPreferences,
            paymentPreferences: loggedUser.paymentPreferences,
        };
    }
}