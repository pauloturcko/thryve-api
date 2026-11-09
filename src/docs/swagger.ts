export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Thryve API",
    version: "1.0.0",
    description:
      "Documentação da API do Thryve com autenticação e gerenciamento de cartões, contas bancárias, categorias e métodos de pagamento.\n\n" +
      "Todo erro responde `{ message }`. Erros de validação (400) trazem também `errors: [{ path, message }]`, um item por campo inválido.",
  },
  servers: [
    {
      url: "https://apithryve.pauloturcko.dev",
      description: "Servidor de Produção",
    },
    {
      url: "http://localhost:3000",
      description: "Servidor Local de Desenvolvimento",
    },
  ],
  // Configuração do botão "Authorize" para autenticação JWT Bearer Token
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Insira o token JWT gerado no login",
      },
    },
    schemas: {
      // ===== USUÁRIOS & AUTH =====
      UserRegisterInput: {
        type: "object",
        required: ["name", "email", "password"], // Define campos OBRIGATÓRIOS
        properties: {
          name: {
            type: "string",
            example: "João Silva",
            description: "Nome completo (mínimo de 3 caracteres)",
          },
          email: {
            type: "string",
            format: "email",
            example: "joao@email.com",
            description: "E-mail de acesso",
          },
          password: {
            type: "string",
            format: "password",
            example: "12345678",
            description: "Senha (mínimo de 8 caracteres)",
          },
        },
      },
      UserLoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "joao@email.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "12345678",
          },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@email.com" },
          createdAt: { type: "string", format: "date-time" },
          profilePicture: { type: "string", nullable: true, example: null },
        },
      },
      SystemPreferencesResponse: {
        type: "object",
        properties: {
          theme: {
            type: "integer",
            enum: [0, 1],
            description: "0 = dark, 1 = light",
            example: 0,
          },
          language: {
            type: "integer",
            enum: [0, 1, 2],
            description: "0 = português, 1 = inglês, 2 = espanhol",
            example: 0,
          },
          currency: {
            type: "integer",
            enum: [0, 1, 2, 3, 4, 5],
            description: "0 = BRL, 1 = USD, 2 = AUS, 3 = NZD, 4 = EUR, 5 = GBP",
            example: 0,
          },
        },
      },
      PaymentPreferenceResponse: {
        type: "object",
        properties: {
          paymentMethodId: { type: "integer", example: 1 },
          name: { type: "string", example: "Pix" },
          slug: { type: "string", example: "pix" },
          isActive: { type: "boolean", example: true },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "JWT Bearer token, expira em 1h",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          user: { $ref: "#/components/schemas/UserResponse" },
          systemPreferences: { $ref: "#/components/schemas/SystemPreferencesResponse" },
          paymentPreferences: {
            type: "array",
            items: { $ref: "#/components/schemas/PaymentPreferenceResponse" },
          },
        },
      },
      LoggedUserResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/UserResponse" },
          systemPreferences: { $ref: "#/components/schemas/SystemPreferencesResponse" },
          paymentPreferences: {
            type: "array",
            items: { $ref: "#/components/schemas/PaymentPreferenceResponse" },
          },
        },
      },

      // ===== CARTÕES =====
      CardRegisterInput: {
        type: "object",
        required: [
          "name",
          "cardType",
          "cardFlag",
          "limit",
          "expiresIn",
          "lastFourDigits",
        ],
        properties: {
          name: {
            type: "string",
            example: "Cartão Nubank",
            description: "Apelido do cartão",
          },
          cardType: {
            type: "integer",
            enum: [1, 2, 3],
            description: "1 = Crédito, 2 = Débito, 3 = Crédito e Débito",
            example: 1,
          },
          cardFlag: {
            type: "string",
            enum: ["visa", "mastercard", "elo", "1", "2", "3"],
            description: "Bandeira do cartão (ou código numérico)",
            example: "mastercard",
          },
          limit: {
            type: "string",
            description: "Limite do cartão (mínimo 100). Aceita '5000.00' ou formato BR '5.000,00'",
            example: "5000.00",
          },
          expiresIn: {
            type: "string",
            description: "Validade no formato MM/YY",
            example: "12/28",
          },
          lastFourDigits: {
            type: "string",
            description: "4 últimos dígitos do cartão",
            example: "1234",
          },
        },
      },
      CardUpdateInput: {
        type: "object",
        required: ["id"], // Apenas o ID é obrigatório no update
        properties: {
          id: {
            type: "integer",
            description: "ID do cartão a ser atualizado (Obrigatório)",
            example: 1,
          },
          name: {
            type: "string",
            description: "Novo nome (Opcional)",
            example: "Cartão Inter",
          },
          cardType: {
            type: "integer",
            enum: [1, 2, 3],
            description: "Tipo do cartão (Opcional)",
            example: 2,
          },
          cardFlag: {
            type: "string",
            description: "Bandeira (Opcional)",
            example: "visa",
          },
          limit: {
            type: "string",
            description: "Novo limite (Opcional)",
            example: "6000.00",
          },
          expiresIn: {
            type: "string",
            description: "Nova data de expiração (Opcional)",
            example: "05/29",
          },
          lastFourDigits: {
            type: "string",
            description: "Últimos 4 dígitos (Opcional)",
            example: "5678",
          },
        },
      },
      CardDeleteInput: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "integer",
            description: "ID do cartão a ser removido",
            example: 1,
          },
        },
      },

      // ===== CONTAS BANCÁRIAS =====
      BankAccountRegisterInput: {
        type: "object",
        required: ["name", "accountType"],
        properties: {
          name: {
            type: "string",
            example: "Nubank",
            description: "Nome da conta (mínimo de 3 caracteres)",
          },
          accountType: {
            type: "integer",
            enum: [0, 1, 2, 3, 4],
            description: "0 = Conta digital, 1 = Conta corrente, 2 = Poupança, 3 = Carteira digital, 4 = Dinheiro",
            example: 0,
          },
          balance: {
            type: "string",
            description: "Saldo inicial (padrão 0.00). Aceita negativo e os formatos '5000.00', '5.000,00' ou '5,000.00'",
            example: "1500.00",
          },
        },
      },
      BankAccountUpdateInput: {
        type: "object",
        required: ["id"], // Apenas o ID é obrigatório no update
        properties: {
          id: {
            type: "integer",
            description: "ID da conta a ser atualizada (Obrigatório)",
            example: 1,
          },
          name: {
            type: "string",
            description: "Novo nome (Opcional)",
            example: "Inter",
          },
          accountType: {
            type: "integer",
            enum: [0, 1, 2, 3, 4],
            description: "Tipo da conta (Opcional)",
            example: 1,
          },
          balance: {
            type: "string",
            description: "Novo saldo (Opcional). Se omitido, o saldo atual é mantido",
            example: "2.300,50",
          },
        },
      },
      BankAccountDeleteInput: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "integer",
            description: "ID da conta a ser removida",
            example: 1,
          },
        },
      },

      // ===== CATEGORIAS =====
      CategoryRegisterInput: {
        type: "object",
        required: ["name", "icon", "color", "type"],
        properties: {
          name: {
            type: "string",
            example: "Alimentação",
            description: "Nome da categoria (mínimo de 3 caracteres)",
          },
          icon: {
            type: "string",
            example: "utensils",
            description: "Identificador do ícone (até 50 caracteres)",
          },
          color: {
            type: "string",
            example: "#FF5733",
            description: "Cor em hexadecimal no formato #RRGGBB",
          },
          type: {
            type: "integer",
            enum: [0, 1],
            description: "0 = Receita, 1 = Despesa",
            example: 1,
          },
        },
      },
      CategoryUpdateInput: {
        type: "object",
        required: ["id"], // Apenas o ID é obrigatório no update
        properties: {
          id: {
            type: "integer",
            description: "ID da categoria a ser atualizada (Obrigatório)",
            example: 1,
          },
          name: {
            type: "string",
            description: "Novo nome (Opcional)",
            example: "Mercado",
          },
          icon: {
            type: "string",
            description: "Novo ícone (Opcional)",
            example: "shopping-cart",
          },
          color: {
            type: "string",
            description: "Nova cor (Opcional)",
            example: "#00AA55",
          },
          type: {
            type: "integer",
            enum: [0, 1],
            description: "Tipo da categoria (Opcional)",
            example: 1,
          },
        },
      },
      CategoryDeleteInput: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "integer",
            description: "ID da categoria a ser removida",
            example: 1,
          },
        },
      },
      IncomeRegisterInput: {
        type: "object",
        required: ["incomeKind", "amount", "date", "categoryId", "bankAccountId"],
        properties: {
          incomeKind: {
            type: "integer",
            enum: [0, 1, 2],
            description: "0 = Recorrente, 1 = Pontual, 2 = Reembolso",
            example: 1,
          },
          amount: {
            type: "string",
            example: "1.500,00",
            description: "Valor maior que zero. Aceita formato BR (1.500,00) e US (1,500.00)",
          },
          date: {
            type: "string",
            example: "2027-01-05",
            description: "Data prevista ou de recebimento, no formato AAAA-MM-DD",
          },
          status: {
            type: "integer",
            enum: [0, 1],
            description: "0 = Pendente, 1 = Pago. Se não for enviado, nasce como pendente. Só lançamento pago altera o saldo da conta",
            example: 0,
          },
          categoryId: {
            type: "integer",
            description: "ID de uma categoria de receita do usuário",
            example: 1,
          },
          bankAccountId: {
            type: "integer",
            description: "ID da conta do usuário onde o valor entra",
            example: 1,
          },
          source: {
            type: "string",
            nullable: true,
            example: "Empresa X",
            description: "Origem da receita, em texto livre (até 100 caracteres)",
          },
          notes: {
            type: "string",
            nullable: true,
            example: "Salário de janeiro",
            description: "Observação livre (até 500 caracteres)",
          },
          linkedTransactionId: {
            type: "integer",
            nullable: true,
            example: 10,
            description: "ID do gasto ao qual o reembolso se refere",
          },
        },
      },
      IncomeUpdateInput: {
        type: "object",
        required: ["id"], // Apenas o ID é obrigatório no update
        properties: {
          id: {
            type: "integer",
            description: "ID da receita a ser atualizada (Obrigatório)",
            example: 1,
          },
          incomeKind: {
            type: "integer",
            enum: [0, 1, 2],
            description: "Novo tipo de receita (Opcional)",
            example: 1,
          },
          amount: {
            type: "string",
            description: "Novo valor (Opcional)",
            example: "1.800,00",
          },
          date: {
            type: "string",
            description: "Nova data, no formato AAAA-MM-DD (Opcional)",
            example: "2027-01-08",
          },
          status: {
            type: "integer",
            enum: [0, 1],
            description: "Novo status (Opcional). Mudar para pago soma no saldo; voltar para pendente desfaz",
            example: 1,
          },
          categoryId: {
            type: "integer",
            description: "Nova categoria de receita (Opcional)",
            example: 2,
          },
          bankAccountId: {
            type: "integer",
            description: "Nova conta (Opcional). Se a receita for paga, o valor sai da conta antiga e entra na nova",
            example: 2,
          },
          source: {
            type: "string",
            nullable: true,
            description: "Nova origem (Opcional)",
            example: "Empresa Y",
          },
          notes: {
            type: "string",
            nullable: true,
            description: "Nova observação (Opcional)",
            example: "Recebido com 3 dias de atraso",
          },
          linkedTransactionId: {
            type: "integer",
            nullable: true,
            description: "Novo gasto vinculado (Opcional)",
            example: 10,
          },
        },
      },
      IncomeDeleteInput: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "integer",
            description: "ID da receita a ser removida",
            example: 1,
          },
        },
      },
      ExpenseRegisterInput: {
        type: "object",
        required: ["expenseKind", "categoryId", "description", "paymentMethodId", "bankAccountId", "amount", "date"],
        properties: {
          expenseKind: {
            type: "integer",
            enum: [0, 1],
            description: "0 = Fixo, 1 = Variável",
            example: 1,
          },
          categoryId: {
            type: "integer",
            description: "ID de uma categoria de gasto do usuário",
            example: 2,
          },
          description: {
            type: "string",
            example: "Conta de luz",
            description: "O que é o gasto, mais específico que a categoria (até 150 caracteres)",
          },
          paymentMethodId: {
            type: "integer",
            description: "ID de uma forma de pagamento ativa nas preferências do usuário",
            example: 5,
          },
          bankAccountId: {
            type: "integer",
            description: "ID da conta do usuário de onde o valor sai",
            example: 1,
          },
          cardId: {
            type: "integer",
            nullable: true,
            description: "ID do cartão do usuário. Obrigatório quando a forma de pagamento é crédito ou débito",
            example: 1,
          },
          amount: {
            type: "string",
            example: "1.200,00",
            description: "Valor total, maior que zero. No parcelado, é dividido entre as parcelas",
          },
          date: {
            type: "string",
            example: "2027-01-10",
            description: "Data prevista ou de pagamento, no formato AAAA-MM-DD. No parcelado, é a data da primeira parcela",
          },
          dueDate: {
            type: "string",
            nullable: true,
            example: "2027-01-15",
            description: "Data de vencimento (opcional), no formato AAAA-MM-DD",
          },
          status: {
            type: "integer",
            enum: [0, 1],
            description: "0 = Pendente, 1 = Pago. Se não for enviado, nasce como pendente. No parcelado, vale só para a primeira parcela",
            example: 0,
          },
          installments: {
            type: "integer",
            minimum: 2,
            maximum: 48,
            description: "Número de parcelas (opcional). Gera um gasto por mês, a partir da data informada",
            example: 3,
          },
          notes: {
            type: "string",
            nullable: true,
            example: "Dividido com a Ana",
            description: "Observação livre (até 500 caracteres)",
          },
        },
      },
      ExpenseUpdateInput: {
        type: "object",
        required: ["id"], // Apenas o ID é obrigatório no update
        properties: {
          id: {
            type: "integer",
            description: "ID do gasto a ser atualizado (Obrigatório). No parcelado, altera só essa parcela",
            example: 1,
          },
          expenseKind: { type: "integer", enum: [0, 1], description: "Novo tipo (Opcional)", example: 0 },
          categoryId: { type: "integer", description: "Nova categoria de gasto (Opcional)", example: 3 },
          description: { type: "string", description: "Nova descrição (Opcional)", example: "Internet" },
          paymentMethodId: { type: "integer", description: "Nova forma de pagamento (Opcional)", example: 1 },
          bankAccountId: {
            type: "integer",
            description: "Nova conta (Opcional). Se o gasto for pago, o valor volta para a conta antiga e sai da nova",
            example: 2,
          },
          cardId: { type: "integer", nullable: true, description: "Novo cartão (Opcional)", example: 2 },
          amount: { type: "string", description: "Novo valor desta parcela (Opcional)", example: "400,00" },
          date: { type: "string", description: "Nova data, no formato AAAA-MM-DD (Opcional)", example: "2027-01-12" },
          dueDate: { type: "string", nullable: true, description: "Novo vencimento (Opcional)", example: "2027-01-20" },
          status: {
            type: "integer",
            enum: [0, 1],
            description: "Novo status (Opcional). Mudar para pago subtrai do saldo; voltar para pendente desfaz",
            example: 1,
          },
          notes: { type: "string", nullable: true, description: "Nova observação (Opcional)", example: "Pago com atraso" },
        },
      },
      ExpenseDeleteInput: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "integer",
            description: "ID do gasto a ser removido. No parcelado, remove só essa parcela",
            example: 1,
          },
        },
      },
    },
  },
  // Definição de cada rota, método HTTP, parâmetros e respostas
  paths: {
    // ------------------ ROTAS DE USUÁRIOS & AUTH ------------------
    "/users/register": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastrar um novo usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UserRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuário cadastrado com sucesso",
          },
          400: {
            description: "Erro de validação nos dados enviados",
          },
          409: {
            description: "E-mail já cadastrado",
          },
          500: {
            description: "Erro interno do servidor",
          },
        },
      },
    },
    "/users/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autenticar usuário e obter Token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UserLoginInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login efetuado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          400: {
            description: "Dados de requisição inválidos",
          },
          401: {
            description: "Credenciais inválidas / Não autorizado",
          },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Usuários"],
        summary: "Obter informações do usuário autenticado",
        security: [{ bearerAuth: [] }], // Indica que necessita de JWT
        responses: {
          200: {
            description: "Dados do usuário logado, com preferências de sistema e de pagamento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoggedUserResponse" },
              },
            },
          },
          401: {
            description: "Token inválido ou não fornecido",
          },
        },
      },
    },

    // ------------------ ROTAS DE CARTÕES ------------------
    "/cards/register": {
      post: {
        tags: ["Cartões"],
        summary: "Cadastrar um novo cartão para o usuário logado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CardRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Cartão registrado com sucesso",
          },
          400: {
            description: "Erro de validação nos campos do cartão",
          },
          401: {
            description: "Não autorizado",
          },
          409: {
            description: "Conflito / Cartão já existente",
          },
        },
      },
    },
    "/cards/user-cards": {
      get: {
        tags: ["Cartões"],
        summary: "Listar todos os cartões do usuário logado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de cartões retornada com sucesso",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/cards/update": {
      patch: {
        tags: ["Cartões"],
        summary: "Atualizar dados de um cartão",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CardUpdateInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cartão atualizado com sucesso",
          },
          400: {
            description: "Erro de validação",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "O cartão pertence a outro usuário",
          },
          404: {
            description: "Cartão não encontrado",
          },
          409: {
            description: "Já existe um cartão com o mesmo nome e últimos 4 dígitos",
          },
        },
      },
    },
    "/cards/delete": {
      delete: {
        tags: ["Cartões"],
        summary: "Remover um cartão",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CardDeleteInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cartão excluído com sucesso",
          },
          400: {
            description: "ID ausente ou inválido",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "O cartão pertence a outro usuário",
          },
          404: {
            description: "Cartão não encontrado",
          },
        },
      },
    },

    // ------------------ ROTAS DE FORMAS DE PAGAMENTO ------------------
    "/payment-method/list": {
      get: {
        tags: ["Formas de Pagamento"],
        summary: "Listar preferências de pagamento do usuário",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de preferências de pagamento",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/payment-method/{id}/update-preferences": {
      patch: {
        tags: ["Formas de Pagamento"],
        summary: "Ativar/desativar preferência de forma de pagamento",
        security: [{ bearerAuth: [] }],
        // Exemplo de parâmetro de rota (Path Parameter)
        parameters: [
          {
            name: "id",
            in: "path",
            required: true, // Indica que o parâmetro de rota é obrigatório
            description: "ID do método de pagamento",
            schema: {
              type: "integer",
              example: 1,
            },
          },
        ],
        responses: {
          200: {
            description: "Status da preferência atualizado com sucesso",
          },
          400: {
            description: "Parâmetro inválido",
          },
          401: {
            description: "Não autorizado",
          },
          404: {
            description: "Método de pagamento não encontrado",
          },
        },
      },
    },

    // ------------------ ROTAS DE CONTAS BANCÁRIAS ------------------
    "/bank-accounts/register": {
      post: {
        tags: ["Contas Bancárias"],
        summary: "Cadastrar uma nova conta bancária para o usuário logado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BankAccountRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Conta bancária registrada com sucesso",
          },
          400: {
            description: "Erro de validação nos campos da conta",
          },
          401: {
            description: "Não autorizado",
          },
          409: {
            description: "Já existe uma conta com o mesmo nome e tipo",
          },
        },
      },
    },
    "/bank-accounts/user-bank-accounts": {
      get: {
        tags: ["Contas Bancárias"],
        summary: "Listar todas as contas bancárias do usuário logado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de contas bancárias retornada com sucesso",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/bank-accounts/update": {
      patch: {
        tags: ["Contas Bancárias"],
        summary: "Atualizar dados de uma conta bancária",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BankAccountUpdateInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Conta bancária atualizada com sucesso",
          },
          400: {
            description: "Erro de validação",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A conta pertence a outro usuário",
          },
          404: {
            description: "Conta bancária não encontrada",
          },
          409: {
            description: "Já existe uma conta com o mesmo nome e tipo",
          },
        },
      },
    },
    "/bank-accounts/delete": {
      delete: {
        tags: ["Contas Bancárias"],
        summary: "Remover uma conta bancária",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BankAccountDeleteInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Conta bancária excluída com sucesso",
          },
          400: {
            description: "ID ausente ou inválido",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A conta pertence a outro usuário",
          },
          404: {
            description: "Conta bancária não encontrada",
          },
        },
      },
    },

    // ------------------ ROTAS DE CATEGORIAS ------------------
    "/categories/register": {
      post: {
        tags: ["Categorias"],
        summary: "Cadastrar uma nova categoria para o usuário logado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CategoryRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Categoria registrada com sucesso",
          },
          400: {
            description: "Erro de validação nos campos da categoria",
          },
          401: {
            description: "Não autorizado",
          },
          409: {
            description: "Já existe uma categoria com o mesmo nome",
          },
        },
      },
    },
    "/categories/user-categories": {
      get: {
        tags: ["Categorias"],
        summary: "Listar todas as categorias do usuário logado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Lista de categorias retornada com sucesso",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/categories/update": {
      patch: {
        tags: ["Categorias"],
        summary: "Atualizar dados de uma categoria",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CategoryUpdateInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Categoria atualizada com sucesso",
          },
          400: {
            description: "Erro de validação",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A categoria pertence a outro usuário",
          },
          404: {
            description: "Categoria não encontrada",
          },
          409: {
            description: "Já existe uma categoria com o mesmo nome",
          },
        },
      },
    },
    "/categories/delete": {
      delete: {
        tags: ["Categorias"],
        summary: "Remover uma categoria",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CategoryDeleteInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Categoria excluída com sucesso",
          },
          400: {
            description: "ID ausente ou inválido",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A categoria pertence a outro usuário",
          },
          404: {
            description: "Categoria não encontrada",
          },
        },
      },
    },

    // ------------------ ROTAS DE RECEITAS ------------------
    "/incomes/register": {
      post: {
        tags: ["Receitas"],
        summary: "Cadastrar uma nova receita para o usuário logado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IncomeRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Receita registrada com sucesso",
          },
          400: {
            description: "Erro de validação nos campos da receita",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A conta, a categoria ou o gasto vinculado pertence a outro usuário",
          },
          404: {
            description: "Conta, categoria ou gasto vinculado não encontrado",
          },
          422: {
            description: "O usuário não tem conta cadastrada, ou a categoria não é de receita",
          },
        },
      },
    },
    "/incomes/user-incomes": {
      get: {
        tags: ["Receitas"],
        summary: "Listar as receitas do usuário logado, com a conta e a categoria de cada uma",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "month",
            in: "query",
            required: false,
            schema: { type: "string", example: "2027-01" },
            description: "Mês no formato AAAA-MM",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "integer", enum: [0, 1] },
            description: "0 = Pendente, 1 = Pago",
          },
          {
            name: "incomeKind",
            in: "query",
            required: false,
            schema: { type: "integer", enum: [0, 1, 2] },
            description: "0 = Recorrente, 1 = Pontual, 2 = Reembolso",
          },
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "ID da categoria",
          },
        ],
        responses: {
          200: {
            description: "Lista de receitas retornada com sucesso, da data mais recente para a mais antiga",
          },
          400: {
            description: "Filtro inválido",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/incomes/update": {
      patch: {
        tags: ["Receitas"],
        summary: "Atualizar dados de uma receita",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IncomeUpdateInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Receita atualizada com sucesso",
          },
          400: {
            description: "Erro de validação",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A receita, a conta ou a categoria pertence a outro usuário",
          },
          404: {
            description: "Receita, conta ou categoria não encontrada",
          },
          422: {
            description: "A categoria não é de receita",
          },
        },
      },
    },
    "/incomes/delete": {
      delete: {
        tags: ["Receitas"],
        summary: "Remover uma receita. Se ela estava paga, o valor sai do saldo da conta",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IncomeDeleteInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Receita excluída com sucesso",
          },
          400: {
            description: "ID ausente ou inválido",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A receita pertence a outro usuário",
          },
          404: {
            description: "Receita não encontrada",
          },
        },
      },
    },

    // ------------------ ROTAS DE GASTOS ------------------
    "/expenses/register": {
      post: {
        tags: ["Gastos"],
        summary: "Cadastrar um gasto. Se for parcelado, gera um gasto por mês e devolve a lista",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExpenseRegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Gasto registrado com sucesso",
          },
          400: {
            description: "Erro de validação nos campos do gasto",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "A conta, a categoria ou o cartão pertence a outro usuário",
          },
          404: {
            description: "Conta, categoria, forma de pagamento ou cartão não encontrado",
          },
          422: {
            description: "Sem conta cadastrada, categoria que não é de gasto, forma de pagamento desativada ou cartão ausente no crédito/débito",
          },
        },
      },
    },
    "/expenses/user-expenses": {
      get: {
        tags: ["Gastos"],
        summary: "Listar os gastos do usuário logado, com conta, categoria, forma de pagamento e cartão",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "month",
            in: "query",
            required: false,
            schema: { type: "string", example: "2027-01" },
            description: "Mês no formato AAAA-MM",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "integer", enum: [0, 1] },
            description: "0 = Pendente, 1 = Pago",
          },
          {
            name: "expenseKind",
            in: "query",
            required: false,
            schema: { type: "integer", enum: [0, 1] },
            description: "0 = Fixo, 1 = Variável",
          },
          {
            name: "categoryId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "ID da categoria",
          },
          {
            name: "paymentMethodId",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "ID da forma de pagamento",
          },
        ],
        responses: {
          200: {
            description: "Lista de gastos retornada com sucesso, da data mais recente para a mais antiga",
          },
          400: {
            description: "Filtro inválido",
          },
          401: {
            description: "Não autorizado",
          },
        },
      },
    },
    "/expenses/update": {
      patch: {
        tags: ["Gastos"],
        summary: "Atualizar um gasto (no parcelado, uma parcela por vez)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExpenseUpdateInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Gasto atualizado com sucesso",
          },
          400: {
            description: "Erro de validação",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "O gasto, a conta, a categoria ou o cartão pertence a outro usuário",
          },
          404: {
            description: "Gasto, conta, categoria, forma de pagamento ou cartão não encontrado",
          },
          422: {
            description: "Categoria que não é de gasto, forma de pagamento desativada ou cartão ausente no crédito/débito",
          },
        },
      },
    },
    "/expenses/delete": {
      delete: {
        tags: ["Gastos"],
        summary: "Remover um gasto (no parcelado, uma parcela). Se ele estava pago, o valor volta para a conta",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExpenseDeleteInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Gasto excluído com sucesso",
          },
          400: {
            description: "ID ausente ou inválido",
          },
          401: {
            description: "Não autorizado",
          },
          403: {
            description: "O gasto pertence a outro usuário",
          },
          404: {
            description: "Gasto não encontrado",
          },
          409: {
            description: "O gasto tem reembolsos vinculados",
          },
        },
      },
    },
  },
};