# Decisões de Arquitetura — Thryve API

Este documento existe pra registrar o **porquê** de decisões que não são óbvias só lendo o código. Não é uma spec completa da API (isso é o Swagger, em `/api-docs`) — é o histórico de raciocínio por trás de escolhas que, sem contexto, pareceriam arbitrárias ou até erradas.

Atualize este arquivo quando tomar uma decisão de arquitetura não-trivial. Não precisa documentar o óbvio.

## Stack

- Node + Express + TypeScript
- TypeORM + PostgreSQL, schema gerenciado só por migration (`synchronize: false` em [data-source.ts](src/db/config/data-source.ts)) — nunca alterar tabela via sync automático, só via `npm run migration:generate`/`migration:create`.
- Validação de entrada com Zod, um validator por domínio em `services/validators/`.

## Camadas: Route → Controller → Service → Repository

- **Controller**: só HTTP. Repassa `req.body`/`req.params` crus pro service (não valida nada), escolhe o status de sucesso e o shape do JSON de resposta, e manda qualquer erro pro `handleError`. Não fala com repository nem com banco.
- **Service**: regra de negócio e validação de entrada (ver seção Validação). É a camada que decide "pode ou não pode", "o que acontece quando X".
- **Repository**: acesso a dado puro, sem regra de negócio.

**Regra combinada**: um Service pode chamar um Repository de outro domínio diretamente (pulando o Service daquele domínio) quando a operação não carrega nenhuma regra de negócio própria — só leitura ou escrita direta, sem validação condicional. Exemplos atuais:
- [`UsersService.register`](src/services/users-service.ts) cria as preferências default (sistema e pagamento) chamando `UserSystemPreferencesRepository`/`UserPaymentPreferencesRepository` direto — são valores fixos, sem decisão de negócio no momento da criação.
- [`UsersService.getLoggedUser`](src/services/users-service.ts) lê essas mesmas preferências direto do repository — leitura pura, sem regra pra aplicar ainda.

Se um dia existir regra de negócio nessas operações (exemplo puramente hipotético discutido: "usuário do cargo X só pode ativar métodos de pagamento Y"), esses pontos precisam passar a chamar um Service de preferências em vez do Repository direto — hoje esse Service seria só um repasse vazio, por isso não existe (`UserPaymentPreferencesService` não existe ainda; `UserSystemPreferencesService` existe só porque `updatePreference` já tem regra real).

## Autenticação (JWT)

- O token ([jwt.ts](src/utils/jwt.ts)) carrega só `{ userId }`, expira em 1h. **De propósito**: o payload de um JWT é imutável entre login e expiração — se preferências do usuário fossem embutidas ali, mudar uma preferência exigiria deslogar/logar de novo pra refletir. Por isso preferências nunca vão para dentro do token.
- [`authMiddleware`](src/http/middlewares/auth-middleware.ts) decodifica o JWT e depois **busca o usuário no banco a cada request** (não confia só no payload do token). Isso já custa uma query por request autenticado.
- `POST /users/login` e `GET /users/me` devolvem o mesmo formato agregado (`user` + `systemPreferences` + `paymentPreferences`) — decisão: o front recebe tudo no login, sem precisar de uma segunda chamada imediata; `/me` existe pra revalidar depois.

## Senha

- `password` na entity `Users` é `select: false` ([users.ts](src/db/models/users.ts)) — nenhuma query traz o hash por padrão. Só [`UsersRepository.loadByEmail`](src/db/repository/users-repository.ts) pede explicitamente via `addSelect`, porque é o único lugar que precisa comparar a senha (login).
- Isso foi corrigido depois de um vazamento real: `UserSystemPreferencesRepository.loadByUserId` carregava a relation `user` inteira (incluindo hash) sem essa proteção. A relation foi removida por ser desnecessária ali (o `user` já vem de outra fonte na mesma chamada).
- `select: false` **não** protege o retorno do `save()`: ele devolve o próprio objeto inserido, com o hash. Por isso `UsersController.register` monta a resposta campo a campo — antes o `POST /users/register` devolvia o hash no JSON.

## DTOs: pasta `db/DTO`

A pasta mistura dois conceitos que merecem atenção na hora de adicionar algo novo:
- `Create*Dto` (`CreateUsersDto`, `CreateUserSystemPreferences`, etc.) — payload de **entrada** pra criação.
- DTOs de **saída/resposta** (`UserPaymentMethodsDto`, `UserSystemPreferences`) — moldam o que a API devolve, e são preenchidos com `.map()` manual a partir da entity, não retornados direto. Isso é proposital: o retorno bruto do TypeORM sempre traz mais campos do que o tipo promete (`id`, `userId`, timestamps, relations inteiras) — a tipagem do TS não filtra nada em runtime, então sem esse mapeamento explícito o shape real da resposta não bate com o documentado.

## Preferências do usuário

- Ao registrar (`UsersService.register`), todo usuário novo ganha automaticamente: `UserSystemPreferences` com defaults (`dark`, `portuguese`, `brl`) e uma `UserPaymentPreferences` **para cada** `PaymentMethods` existente na tabela, todas com `isActive: true`. Ou seja, a lista de formas de pagamento disponíveis é global (cadastrada à parte, `payment_methods`), e cada usuário tem uma preferência própria por método.
- `theme`, `language` e `currency` são enums numéricos (`ThemeEnum`, `LanguagesEnum`, `CurrencyEnum` em `db/enum/`) — o JSON expõe o número, não o nome (`0`, não `"dark"`). O Swagger documenta o mapeamento número→significado.
- **Tradução não mora no banco nem na API.** O back só guarda qual idioma/moeda o usuário escolheu; o front tem o mesmo mapa número→idioma (`0` → `pt-BR`, `1` → `en`, `2` → `es`) e a lib de i18n dele exibe os textos. Moeda idem: o front formata com o código ISO 4217 (`Intl.NumberFormat`). Por isso a chave do enum de moeda é o código ISO em minúsculas (`aud`, não `aus` — renomeado sem impacto, já que o banco guarda o número).
- Idiomas e moedas são listas fixas no código: o usuário só alterna entre as opções via `PATCH /system-preferences/update` (aceita `theme`, `language` e `currency`, ao menos um). Adicionar uma opção é mudar o enum (back) e o mapa (front), sem migration.
- Há um TODO em [languages-enum.ts](src/db/enum/languages-enum.ts) sobre uma feature futura de trazer informações da economia do país do usuário via IA — ainda não implementada.

## Foto de perfil

Fluxo: `POST /profile-picture/upload` (multipart, campo `file`) → [multer](src/http/middlewares/upload-middleware.ts) guarda o arquivo **só em memória** (máx. 5MB) → [`processProfilePicture`](src/utils/process-profile-picture.ts) decodifica com `sharp`, recorta em 512x512 e converte pra WebP → [`ProfilePictureService.upload`](src/services/profile-picture-service.ts) salva os bytes na tabela `profile_pictures` e a URL em `users.profile_picture`, na mesma transação.

- **Bytes no Postgres (`bytea`), não em disco nem em S3.** O disco do Railway é apagado a cada deploy, então salvar em pasta local perderia as fotos. Object storage (S3/R2) é o caminho "de escala", mas exige conta, credenciais e custo; com a imagem reduzida (uma foto de 2MB vira ~20–40KB) o banco aguenta tranquilo nesse volume. Migrar depois é trocar o `ProfilePictureRepository` e o que vai em `users.profile_picture` — o front não muda.
- **Tabela separada, não coluna na `users`**: o `authMiddleware` faz `loadById` a cada request; com a imagem na `users`, todo request autenticado carregaria os bytes.
- **Reprocessar sempre, nunca salvar o original**: o mimetype que o navegador manda é forjável, então quem valida é o `sharp` conseguir decodificar (JPG/PNG/WebP, senão 422). A saída não leva o EXIF da original (foto de celular costuma ter GPS) e `limitInputPixels` barra imagem gigante comprimida (decompression bomb).
- **`GET /profile-picture/:id` é público**: `<img src>` não manda o header `Authorization`. O `id` é um UUID aleatório gerado a cada upload — não dá pra adivinhar a foto de outro usuário (com o id sequencial daria) e a URL muda quando a foto muda, o que permite `Cache-Control: immutable` de 1 ano.
- `users.profile_picture` guarda o caminho **relativo** (`/profile-picture/<uuid>`), porque a API muda de domínio entre ambientes. O front monta com `new URL(profilePicture, API_URL)` — que também funciona se um dia virar URL absoluta de S3.
- O upload é um `upsert` com `ON CONFLICT (user_id)`: troca a foto num comando só, sem estourar a constraint única quando chegam dois uploads ao mesmo tempo.
- Atenção: com `logging: true` no [data-source.ts](src/db/config/data-source.ts), o TypeORM loga os parâmetros do INSERT, ou seja, os bytes da imagem (~80KB de log por upload). Vale desligar o log de queries em produção.

## Investimentos

Duas tabelas: `investments` (o título: instituição, nome, rentabilidade, vencimento, status) e `investment_movements` (o histórico: aporte, resgate e rendimento).

- **Valores não são colunas.** Valor inicial, investido, atual, rendimento total, rendimento em % e rendimento do mês são calculados a partir dos lançamentos em [`InvestmentService`](src/services/investment-service.ts). Guardar o "valor atual" numa coluna exigiria mantê-la sincronizada a cada lançamento editado ou apagado; somando na leitura não tem como divergir. O volume é de uso pessoal, então somar em memória é suficiente.
- **Rendimento não é "final − inicial".** Com aportes no meio, essa conta mistura dinheiro novo com ganho. O rendimento é a soma dos lançamentos tipo 2, e o percentual é `rendimento / total aportado`.
- **O aporte inicial é um lançamento comum** (tipo 0), criado junto com o investimento. Assim editar ou apagar ele segue as mesmas regras de saldo dos outros aportes, e não existe uma coluna `initial_amount` para ficar duplicada.
- **Saldo da conta**: aporte sai, resgate volta, rendimento não mexe (o dinheiro continua dentro do título). Vale a mesma regra de receitas e gastos: lançamento com data anterior ao cadastro da conta não altera o saldo, porque o saldo inicial informado já reflete ele. Investimento não vira gasto nem receita em `transactions`; para gráficos de saída, somar os aportes de `investment_movements` à parte.
- **`POST /investments/update-value`** é o fluxo do dia a dia: o usuário informa quanto o título vale hoje e a API grava a diferença como rendimento (pode ser negativo).
- **Sem vínculo com metas na v1.** Um mesmo título (ex.: Tesouro) costuma servir a várias metas ao mesmo tempo, e as metas nem sempre têm dinheiro guardado. Se voltar, o caminho mais simples é uma coluna `goal_id` nullable em `investments`.
- **Rentabilidade estruturada** em três campos: `index_type` (pré, Selic, CDI, IPCA, sem indexador), `index_percentage` (o 110 de "110% do CDI") e `spread_rate` (o 0,10 de "Selic + 0,10%", o 6 de "IPCA + 6%", a taxa do pré). Texto livre não deixaria calcular.

### Projeção pelas taxas do Banco Central

- **Fonte**: API SGS do Banco Central (pública, sem chave), em [central-bank-client.ts](src/services/central-bank-client.ts). Séries 11 (Selic diária), 12 (CDI diário) e 433 (IPCA mensal). Séries diárias exigem `dataInicial`/`dataFinal` com janela de até 10 anos, e intervalo sem dado publicado responde **404**, não lista vazia.
- **Cache em `index_rates`**: o cálculo nunca chama o BC direto. [`IndexRateService.ensureSynced`](src/services/index-rate-service.ts) busca só o que falta, no máximo a cada 6h por índice, e na leitura (sem cron: com um usuário só, a primeira tela do dia sincroniza). Sempre mantém pelo menos ~13 meses (IPCA de 12 meses, e uma primeira sincronização num sábado não volta vazia). Falha do BC só gera log: a conta segue com o que está salvo e `ratesUpdatedUntil` mostra até quando.
- **Calendário de dias úteis = datas da série da Selic**: o BC só publica em dia útil, então não precisa de tabela de feriados. Dias depois do último publicado (hoje, atraso de publicação) contam como dias de semana com a última taxa conhecida. O IPCA do mês ainda não divulgado repete o último mês.
- **Fórmulas por dia útil** (base 252), em [investment-projection.ts](src/services/investment-projection.ts): Selic/CDI `(1 + taxa_dia × p) × (1 + spread)^(1/252)`; IPCA `(1 + ipca_mês × p)^(1/dias_úteis_do_mês) × (1 + spread)^(1/252)`; pré `(1 + taxa)^(1/252)`. Conferido contra cálculo independente com os dados do BC (CDB 110% CDI em 12 meses com 6 mudanças de Selic, Tesouro IPCA+).
- **O valor informado pelo usuário é a verdade, a projeção só estima a partir dele.** O último rendimento lançado (via `update-value`) é o último valor confirmado; a estimativa corrige esse valor e cada aporte/resgate posterior desde a data dele. A projeção nunca grava lançamento: um rendimento estimado salvo ficaria errado na próxima conferência. Por isso a resposta tem os dois lados: `currentAmount` (confirmado) e `estimatedAmount` (projetado).
- **Valor bruto**: sem IR regressivo, IOF nem taxa de custódia da B3. O líquido exige IR por aporte conforme o prazo, e fica para uma próxima fase.

## Validação (Zod) e normalização de dados

- **O `.parse()` fica no Service, nunca no Controller.** O service recebe `data: unknown` e valida na primeira linha; o controller só repassa `req.body`/`req.params`. Assim qualquer chamador do service (rota hoje; job, script ou teste amanhã) passa pela mesma validação sem precisar lembrar. Nas primeiras versões (#0001–#0003) o parse ficava no controller; foi movido de propósito no #0004/#0005.
- Isso inclui ids: `delete` recebe o body e valida `{ id }` como o `update` já fazia, e o toggle de forma de pagamento valida `req.params` (com `z.coerce`, porque path param chega como string). Não é formalidade: o TypeORM trata `id: undefined` como "sem filtro", e `findOne({ where: { id: undefined } })` devolve a **primeira linha da tabela**, de qualquer usuário.
- Validators reaproveitados entre domínios ficam em [common-validator.ts](src/services/validators/common-validator.ts): `idValidator` (inteiro positivo) e `moneyValidator`.
- `name` de cartão, conta bancária e categoria é normalizado (`trim().toLowerCase()`) no validator antes de salvar ou comparar — evita duplicata por diferença de caixa/espaço (ver os `@Unique` nas entities). O `trim` vem antes do `min(3)`, senão `"   a"` passaria.
- `cardFlag` aceita tanto nome (`visa`) quanto código numérico (`1`) no input — flexibilidade deliberada de input, sempre normalizado pro enum internamente ([card-validator.ts](src/services/validators/card-validator.ts)).
- Valores monetários (`limit` do cartão, `balance` da conta) usam o mesmo `moneyValidator`: aceita formato BR (`8.000,00`) e US (`8,000.00`), com ou sem decimais. Como decimal tem no máximo 2 dígitos, só o último separador seguido de 1–2 dígitos é decimal e qualquer outro é de milhar — `8.000` é oito mil (antes virava `8.00`). O teto é `9.999.999.999,99`, o máximo do `numeric(12,2)` das colunas. `balance` aceita negativo; `limit` exige no mínimo 100.
- No update de conta bancária, `balance` é redefinido como `.optional()` depois do `.partial()` de propósito: no Zod 4 o `.partial()` mantém o `.default("0.00")`, e todo PATCH sem `balance` zeraria o saldo.
- `expiresIn` do cartão rejeita datas já vencidas (antes do mês atual).

## Tratamento de erros

Todo controller termina o `catch` com [`handleError`](src/http/helpers/handle-error.ts), o único lugar que traduz erro → status HTTP. Antes cada controller tinha seu próprio `if/else`, e eles divergiam (formato do 400, qual erro virava 409). Os controllers também não respondem 401 na mão: lançam `UnauthorizedError` dentro do `try`.

Toda resposta de erro tem o formato `{ code, message }`:

| Erro lançado | Status | Corpo |
|---|---|---|
| `ZodError` | 400 | `{ code: "VALIDATION_ERROR", message, errors: [{ path, code, message }] }` |
| `UnauthorizedError` | 401 | `{ code, message }` |
| `ForbiddenError` | 403 | `{ code, message }` |
| `NotFoundError` | 404 | `{ code, message }` |
| `BusinessRuleError` | 422 | `{ code, message }` |
| `GenericError` | 409 | `{ code, message }` |
| `MulterError` | 413 / 400 | `{ code: "PROFILE_PICTURE_TOO_LARGE" \| "PROFILE_PICTURE_UPLOAD_ERROR", message }` |
| qualquer outro | 500 | `{ code: "INTERNAL_ERROR", message: "Internal server error" }` — detalhe só no `console.error` |

### Códigos de erro (`code`)

- **Por quê**: o front traduz a interface (pt-BR, en, es) e a tradução não mora na API (ver "Preferências do usuário"). As mensagens que a API devolvia eram uma mistura de inglês e português e não davam pra traduzir com segurança. O `code` é o contrato; o `message` virou só apoio pra log e debug e pode mudar sem aviso.
- Todos os erros conhecidos estendem [`AppError`](src/errors/app-error.ts), que exige um [`ErrorCode`](src/errors/error-code.ts). A classe define o status HTTP; o código define *qual* erro foi (ex.: `NotFoundError` com `CARD_NOT_FOUND` ou `CATEGORY_NOT_FOUND`).
- **Nunca renomear um código existente**: quebra a tradução no front. Erro novo = código novo.
- No 400 de validação, cada item de `errors` traz o código nativo do Zod (`too_small`, `invalid_format`...) ou, em regra própria (`refine`/`addIssue`), um [`ValidationIssueCode`](src/errors/error-code.ts) passado em `params: { code }`. Com `path` + `code` o front consegue montar a mensagem do campo.
- O login com email ou senha errados responde 401 com `INVALID_CREDENTIALS` (e não `UNAUTHORIZED`), pra o front distinguir "credencial errada" de "sessão expirada". O `message` continua `"Unauthorized"` porque o front atual compara esse texto.
- O Swagger gera a lista de códigos a partir dos próprios enums (`Object.values(ErrorCode)`), então a doc não desatualiza.

- `GenericError` hoje significa conflito/duplicidade (email, cartão, conta, categoria), por isso 409. Erro de negócio que não seja conflito deve ganhar classe própria em vez de reaproveitar o `GenericError`.
- O 500 nunca serializa o erro na resposta: um `QueryFailedError` do TypeORM carrega a query SQL, os parâmetros e o erro do Postgres, e antes isso ia inteiro pro cliente.

---

## Ideias anotadas (ainda não implementadas)

### Troca de moeda com lançamentos existentes
Hoje `currency` só muda a formatação: um gasto de `100` salvo em BRL passa a aparecer como US$ 100. Duas saídas a decidir:
- **Converter os valores** pela cotação do dia da troca: mexe em todos os registros, é irreversível na prática (trocar e destrocar não volta ao valor original por causa do arredondamento) e reescreve o histórico com uma cotação que não era a da época.
- **Manter os valores e exibir a conversão ao lado** (recomendado): cada lançamento guarda a moeda em que foi feito (nova coluna `currency` em `transactions`, `bank_account`, `cards.limit`) e a tela mostra o valor original + o equivalente na moeda preferida pela cotação atual (ou da data do lançamento, buscando de uma API de câmbio e cacheando por dia). Nada se perde e o usuário que mudou de país continua vendo o que gastou de verdade.

### Refresh token com logout por inatividade
Objetivo: quem está usando o sistema nunca é deslogado; quem saiu do computador é. Proposta:
- **Access token curto** (o mesmo JWT de hoje, mas com 15 min em vez de 1h) + **refresh token longo** (string aleatória, não JWT) salvo **com hash** numa tabela `refresh_tokens` (`user_id`, `token_hash`, `expires_at`, `last_used_at`, `revoked_at`). Endpoints `POST /users/refresh` e `POST /users/logout`.
- **Rotação**: cada `/refresh` invalida o refresh usado e devolve um par novo. Se um refresh já usado aparecer de novo, é sinal de roubo → revoga a sessão inteira.
- **Inatividade no servidor**: o refresh expira se ficar ~30 min sem uso (janela deslizante) e tem validade máxima de ~7 dias. O servidor não vê o mouse, mas como o front só chama `/refresh` quando o usuário está ativo, sessão parada morre sozinha, mesmo com a aba aberta.
- **Front**: escuta `mousemove`/`keydown`/`click`/`scroll`/`touchstart` (com throttle) e guarda `lastActivity` no `localStorage` (vale pra todas as abas). Faltando ~1 min pro access token expirar: se teve atividade desde o último refresh → chama `/refresh`; se passou do limite de inatividade → aviso "Você ainda está aí?" com contagem e, sem resposta, logout. Um interceptor do axios trata o 401 com uma tentativa de refresh antes de deslogar, com uma única promise de refresh compartilhada (e `navigator.locks` entre abas, senão duas abas rotacionam o mesmo token e a detecção de roubo derruba a sessão).
- Cookie `httpOnly` pro refresh token é opcional: front (`thryve.pauloturcko.dev`) e API (`apithryve.pauloturcko.dev`) são o mesmo site, então funcionaria com `SameSite=Lax` e protegeria o refresh de XSS. Dá pra começar com o refresh no corpo da resposta.

### Open Finance (importar gastos direto do banco)
- **Plaid** não atende o Brasil: os países aceitos no `/link/token/create` são EUA, Canadá, Reino Unido e países da Europa.
- **Pluggy** é o agregador brasileiro (Open Finance regulado + conectores próprios). Fluxo: back gera `apiKey` (clientId/secret, 2h) → cria `connect token` (30 min) → front abre o widget Pluggy Connect → usuário autoriza no app do banco → back guarda o `itemId` ligado ao usuário → webhooks (`item/updated`, `transactions/created`) avisam de dados novos → back busca e grava como `Transaction`.
- **Custo**: sandbox grátis; produção a partir de ~R$ 2.500/mês (dados). O **Meu Pluggy** é grátis sem prazo, mas só pras contas do próprio dono (até 5 conexões) e sem uso comercial: serve pra prototipar com as suas contas, não pra liberar pros usuários.

---

## Perguntas em aberto (pra você responder, não assumi nada aqui)

1. **`authMiddleware` busca o usuário completo no banco a cada request autenticado**, em vez de confiar só no `userId` do JWT decodificado. Isso é intencional (ex: permitir bloquear/deletar usuário e invalidar acesso na hora, sem esperar o token expirar), ou só não foi otimizado ainda?
2. **`PaymentMethodsService.getUserPreferences`** (rota `GET /payment-method/list`) devolve o array de preferências direto do repository, com a entity completa (`paymentMethod` aninhado com todos os campos) — sem o mapeamento pro DTO trimado que criamos pro login/`/me`. Isso é proposital (endpoints diferentes, contratos diferentes), ou deveria usar o mesmo `UserPaymentMethodsDto`?
