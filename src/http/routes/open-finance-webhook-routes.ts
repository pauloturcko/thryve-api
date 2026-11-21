import express, {Router} from "express";
import {OpenFinanceWebhookController} from "../controllers/open-finance-webhook-controller";

const openFinanceWebhookRouter = Router()
const openFinanceWebhookController = new OpenFinanceWebhookController()

openFinanceWebhookRouter.post(
    '/pluggy',
    express.raw({type: "*/*", limit: "1mb"}),
    (req, res) => openFinanceWebhookController.pluggy(req, res),
);

export {openFinanceWebhookRouter};
