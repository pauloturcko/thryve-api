// Código estável de cada erro, para o front traduzir a mensagem no idioma do usuário.
// O texto em `message` continua indo junto, mas é só apoio para log e debug: não é contrato.
// Renomear um código quebra a tradução no front, então só adicione códigos novos.
export enum ErrorCode {
    // Genéricos
    unauthorized = "UNAUTHORIZED",
    invalidCredentials = "INVALID_CREDENTIALS",
    forbidden = "FORBIDDEN",
    validationError = "VALIDATION_ERROR",
    invalidJson = "INVALID_JSON",
    internalError = "INTERNAL_ERROR",

    // Usuário e preferências
    emailAlreadyExists = "EMAIL_ALREADY_EXISTS",
    preferencesNotFound = "PREFERENCES_NOT_FOUND",

    // Foto de perfil
    profilePictureTooLarge = "PROFILE_PICTURE_TOO_LARGE",
    profilePictureUploadError = "PROFILE_PICTURE_UPLOAD_ERROR",
    profilePictureInvalidImage = "PROFILE_PICTURE_INVALID_IMAGE",
    profilePictureNotFound = "PROFILE_PICTURE_NOT_FOUND",

    // Cartões
    cardAlreadyExists = "CARD_ALREADY_EXISTS",
    cardNotFound = "CARD_NOT_FOUND",
    cardLimitRequired = "CARD_LIMIT_REQUIRED",
    cardHasTransactions = "CARD_HAS_TRANSACTIONS",
    cardRequired = "CARD_REQUIRED",
    cardDebitOnly = "CARD_DEBIT_ONLY",
    cardCreditOnly = "CARD_CREDIT_ONLY",

    // Contas bancárias
    bankAccountAlreadyExists = "BANK_ACCOUNT_ALREADY_EXISTS",
    bankAccountNotFound = "BANK_ACCOUNT_NOT_FOUND",
    bankAccountHasTransactions = "BANK_ACCOUNT_HAS_TRANSACTIONS",
    bankAccountRequired = "BANK_ACCOUNT_REQUIRED",

    // Categorias
    categoryAlreadyExists = "CATEGORY_ALREADY_EXISTS",
    categoryNotFound = "CATEGORY_NOT_FOUND",
    categoryHasTransactions = "CATEGORY_HAS_TRANSACTIONS",
    categoryTypeLocked = "CATEGORY_TYPE_LOCKED",
    categoryMustBeIncome = "CATEGORY_MUST_BE_INCOME",
    categoryMustBeExpense = "CATEGORY_MUST_BE_EXPENSE",

    // Formas de pagamento
    paymentMethodNotFound = "PAYMENT_METHOD_NOT_FOUND",
    paymentMethodDisabled = "PAYMENT_METHOD_DISABLED",

    // Receitas e gastos
    incomeNotFound = "INCOME_NOT_FOUND",
    expenseNotFound = "EXPENSE_NOT_FOUND",
    expenseHasRefunds = "EXPENSE_HAS_REFUNDS",
    installmentsRequireCredit = "INSTALLMENTS_REQUIRE_CREDIT",
}

// Códigos usados em `errors[].code` do 400 de validação, além dos códigos nativos do Zod
// (`too_small`, `invalid_format`, `invalid_type`...). Servem para regras que o Zod não nomeia.
export enum ValidationIssueCode {
    nameWithoutAlphanumeric = "NAME_WITHOUT_ALPHANUMERIC",
    amountTooLarge = "AMOUNT_TOO_LARGE",
    amountNotPositive = "AMOUNT_NOT_POSITIVE",
    invalidDate = "INVALID_DATE",
    cardLimitTooLow = "CARD_LIMIT_TOO_LOW",
    cardLimitRequired = "CARD_LIMIT_REQUIRED",
    cardExpired = "CARD_EXPIRED",
    preferencesEmpty = "PREFERENCES_EMPTY",
}
