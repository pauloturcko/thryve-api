import {DataSource} from "typeorm";
import {PaymentMethodEnum} from "../enum/payment-method-enum";

// Catálogo fixo. Os ids são contrato: o PaymentMethodEnum daqui e o enum do front usam 1 a 5.
const PAYMENT_METHODS = [
    {id: PaymentMethodEnum.pix, name: "Pix", slug: "pix", requiresCard: false},
    {id: PaymentMethodEnum.bankSlip, name: "Boleto", slug: "bank_slip", requiresCard: false},
    {id: PaymentMethodEnum.cash, name: "Dinheiro", slug: "cash", requiresCard: false},
    {id: PaymentMethodEnum.debitCard, name: "Cartão de Débito", slug: "debit_card", requiresCard: true},
    {id: PaymentMethodEnum.creditCard, name: "Cartão de Crédito", slug: "credit_card", requiresCard: true},
];

// O seed original vive só na migration CreatePaymentMethods. Se o banco for esvaziado sem refazer as
// migrations, o catálogo some e todo cadastro novo nasce sem formas de pagamento. Roda a cada boot e
// é idempotente: recria o que faltar no catálogo e as preferências que faltarem para cada usuário.
export async function seedPaymentMethods(dataSource: DataSource) {
    await dataSource.transaction(async (manager) => {
        for (const method of PAYMENT_METHODS) {
            await manager.query(
                `INSERT INTO payment_methods (id, name, slug, requires_card)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [method.id, method.name, method.slug, method.requiresCard],
            );
        }

        // Os ids entraram fixos, então a sequência precisa andar até eles para os próximos inserts.
        await manager.query(
            `SELECT setval(pg_get_serial_sequence('payment_methods', 'id'), (SELECT MAX(id) FROM payment_methods))`,
        );

        await manager.query(
            `INSERT INTO user_payment_preferences (user_id, payment_method_id, is_active)
             SELECT users.id, payment_methods.id, true
             FROM users CROSS JOIN payment_methods
             ON CONFLICT (user_id, payment_method_id) DO NOTHING`,
        );
    });
}
