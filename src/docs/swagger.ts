export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "WhaiData API",
    version: "1.0.0",
    description:
      "Documentação da API do WhaiData com autenticação e gerenciamento de cartões, contas bancárias, categorias e métodos de pagamento.\n\n" +
      "Todo erro responde `{ message }`. Erros de validação (400) trazem também `errors: [{ path, message }]`, um item por campo inválido.",
  },
  servers: [
    {
      url: "https://apiwhaidata.pauloturcko.dev",
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
  },
};