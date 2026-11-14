import express, { NextFunction, Request, Response } from "express";
import http from "http";
import cors from "cors";
import { appDataSource } from "./db/config/data-source";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";
import { userRouter } from "./http/routes/user-routes";
import { authRouter } from "./http/routes/auth-routes";
import { cardRouter } from "./http/routes/card-routes";
import { paymentMethodsRouter } from "./http/routes/payment-methods-routes";
import { bankAccountRouter } from "./http/routes/bank-account-routes";
import { categoryRouter } from "./http/routes/category-routes";
import { incomeRouter } from "./http/routes/income-routes";
import { expenseRouter } from "./http/routes/expense-routes";
import { systemPreferencesRouter } from "./http/routes/system-preferences-routes";
import { profilePictureRouter } from "./http/routes/profile-picture-routes";
import { goalRouter } from "./http/routes/goal-routes";
import { investmentRouter } from "./http/routes/investment-routes";
import { indexRateRouter } from "./http/routes/index-rate-routes";
import { ErrorCode } from "./errors";

const app = express();
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");

const allowedOrigins = [
  "http://localhost:3000",
  "https://thryve.pauloturcko.dev",
  ...(process.env.CLIENT_URL ?? "").split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin || allowedOrigins.includes("*") || allowedOrigins.includes(normalizeOrigin(origin));
      callback(null, isAllowed);
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const PORT = process.env.PORT || 3000;

app.use("/users", userRouter);
app.use("/users", authRouter);
app.use("/cards", cardRouter);
app.use("/payment-method", paymentMethodsRouter);
app.use("/bank-accounts", bankAccountRouter);
app.use("/categories", categoryRouter);
app.use("/incomes", incomeRouter);
app.use("/expenses", expenseRouter);
app.use("/system-preferences", systemPreferencesRouter);
app.use("/profile-picture", profilePictureRouter);
app.use("/goals", goalRouter);
app.use("/investments", investmentRouter);
app.use("/indexes", indexRateRouter);

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed") {
    return res.status(400).json({ code: ErrorCode.invalidJson, message: "Invalid JSON" });
  }
  return next(error);
});

appDataSource
  .initialize()
  .then(() => {
    console.log("Database connected successfully!");

    app.get("/", (req, res) => {
      res.send("DB Connected!");
    });

    const server = http.createServer(app);
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Listening on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the DB:", error);
  });
