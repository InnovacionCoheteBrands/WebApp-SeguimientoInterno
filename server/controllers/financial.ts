import { Router, type NextFunction, type Request, type Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import {
    insertTransactionSchema,
    updateTransactionSchema,
    insertRecurringTransactionSchema,
    updateRecurringTransactionSchema
} from "@shared/schema";
import { z } from "zod";
import { logAction } from "../utils/audit-helper";
import { AppError, asyncHandler } from "../middleware/error-handler";

const router = Router();
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        return next(new AppError("Access denied", 403, "FINANCE_FORBIDDEN"));
    }
    next();
};

const positiveIntParamSchema = z.coerce.number().int().positive();
const financialCalendarQuerySchema = z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
});
const optionalDateRangeQuerySchema = z.object({
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
});
const monthlyObligationsQuerySchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
});
const payObligationSchema = z.object({
    paidDate: z.string().min(1).optional(),
});
const MAX_FINANCIAL_CALENDAR_RANGE_MONTHS = 24;

const parseQueryDate = (value: string): Date | null => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const exceedsFinancialCalendarRange = (startDate: Date, endDate: Date): boolean => {
    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + MAX_FINANCIAL_CALENDAR_RANGE_MONTHS);
    return endDate > maxEndDate;
};

const parsePositiveIntParam = (value: unknown, code: string): number => {
    const parsed = positiveIntParamSchema.safeParse(value);
    if (!parsed.success) {
        throw new AppError("Invalid ID", 400, code, parsed.error.errors);
    }
    return parsed.data;
};

const parseDateOrThrow = (value: string, fieldName: string): Date => {
    const parsedDate = parseQueryDate(value);
    if (!parsedDate) {
        throw new AppError(`${fieldName} must be a valid date.`, 400, "INVALID_DATE");
    }
    return parsedDate;
};

router.use(requireAdmin);

// Transactions endpoints
router.get("/transactions", asyncHandler(async (_req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
}));

router.get("/transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_TRANSACTION_ID");
    const transaction = await storage.getTransactionById(id);
    if (!transaction) {
        throw new AppError("Transaction not found.", 404, "TRANSACTION_NOT_FOUND");
    }
    res.json(transaction);
}));

router.post("/transactions", asyncHandler(async (req, res) => {
    const validatedData = insertTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(validatedData);
    logAction(req, "CREATE", "FINANCE", transaction.id.toString(), `Registró transacción: ${validatedData.description || "Sin descripción"} ($${validatedData.amount})`);
    res.status(201).json(transaction);
}));

router.patch("/transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_TRANSACTION_ID");
    const validatedData = updateTransactionSchema.parse(req.body);
    const transaction = await storage.updateTransaction(id, validatedData);
    if (!transaction) {
        throw new AppError("Transaction not found.", 404, "TRANSACTION_NOT_FOUND");
    }
    logAction(req, "UPDATE", "FINANCE", id.toString(), `Actualizó la transacción '${transaction.description}'`, validatedData as Record<string, any>);
    res.json(transaction);
}));

router.delete("/transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_TRANSACTION_ID");
    const deleted = await storage.deleteTransaction(id);
    if (!deleted) {
        throw new AppError("Transaction not found.", 404, "TRANSACTION_NOT_FOUND");
    }
    logAction(req, "DELETE", "FINANCE", id.toString(), `Eliminó la transacción #${id}`);
    res.status(204).send();
}));

router.get("/finance/payment-calendar", asyncHandler(async (req, res) => {
    const parsedQuery = financialCalendarQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        throw new AppError("startDate and endDate are required", 400, "INVALID_CALENDAR_QUERY");
    }

    const startDate = parseDateOrThrow(parsedQuery.data.startDate, "startDate");
    const endDate = parseDateOrThrow(parsedQuery.data.endDate, "endDate");

    if (startDate > endDate) {
        throw new AppError("startDate must be less than or equal to endDate.", 400, "INVALID_DATE_RANGE");
    }

    if (exceedsFinancialCalendarRange(startDate, endDate)) {
        throw new AppError("Date range cannot exceed 24 months", 400, "DATE_RANGE_TOO_LARGE");
    }
    try {
        const calendar = await storage.getFinancialCalendar(startDate, endDate);
        res.json(calendar);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch financial calendar");
        throw new AppError("Failed to fetch financial calendar", 500, "FINANCIAL_CALENDAR_FAILED");
    }
}));

router.get("/finance/summary", asyncHandler(async (req, res) => {
    const parsedQuery = optionalDateRangeQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        throw new AppError("Invalid date range.", 400, "INVALID_SUMMARY_QUERY", parsedQuery.error.errors);
    }

    const startDate = parsedQuery.data.startDate
        ? parseDateOrThrow(parsedQuery.data.startDate, "startDate")
        : undefined;
    const endDate = parsedQuery.data.endDate
        ? parseDateOrThrow(parsedQuery.data.endDate, "endDate")
        : undefined;

    if (startDate && endDate && startDate > endDate) {
        throw new AppError("startDate must be less than or equal to endDate.", 400, "INVALID_DATE_RANGE");
    }

    const summary = await storage.getFinancialSummary(startDate, endDate);
    res.json(summary);
}));

// Recurring Transactions endpoints
router.get("/recurring-transactions", asyncHandler(async (_req, res) => {
    const recurring = await storage.getRecurringTransactions();
    res.json(recurring);
}));

router.get("/recurring-transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_RECURRING_ID");
    const recurring = await storage.getRecurringTransactionById(id);
    if (!recurring) {
        throw new AppError("Recurring transaction not found.", 404, "RECURRING_NOT_FOUND");
    }
    res.json(recurring);
}));

router.post("/recurring-transactions", asyncHandler(async (req, res) => {
    const dataToValidate = {
        ...req.body,
        nextExecutionDate: req.body.nextExecutionDate ? new Date(req.body.nextExecutionDate) : undefined,
        lastExecutionDate: req.body.lastExecutionDate ? new Date(req.body.lastExecutionDate) : undefined,
    };

    const validatedData = insertRecurringTransactionSchema.parse(dataToValidate);
    const recurring = await storage.createRecurringTransaction(validatedData);
    logAction(req, "CREATE", "FINANCE_RECURRING", recurring.id.toString(), `Creó transacción recurrente '${recurring.description}'`);
    res.status(201).json(recurring);
}));

router.patch("/recurring-transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_RECURRING_ID");
    const dataToValidate = {
        ...req.body,
        nextExecutionDate: req.body.nextExecutionDate ? new Date(req.body.nextExecutionDate) : undefined,
        lastExecutionDate: req.body.lastExecutionDate ? new Date(req.body.lastExecutionDate) : undefined,
    };
    const validatedData = updateRecurringTransactionSchema.parse(dataToValidate);
    const recurring = await storage.updateRecurringTransaction(id, validatedData);
    if (!recurring) {
        throw new AppError("Recurring transaction not found.", 404, "RECURRING_NOT_FOUND");
    }
    logAction(req, "UPDATE", "FINANCE_RECURRING", id.toString(), `Actualizó transacción recurrente '${recurring.description}'`, validatedData as Record<string, any>);
    res.json(recurring);
}));

router.delete("/recurring-transactions/:id", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_RECURRING_ID");
    const deleted = await storage.deleteRecurringTransaction(id);
    if (!deleted) {
        throw new AppError("Recurring transaction not found.", 404, "RECURRING_NOT_FOUND");
    }
    logAction(req, "DELETE", "FINANCE_RECURRING", id.toString(), `Eliminó transacción recurrente #${id}`);
    res.status(204).send();
}));

// Execute a specific recurring transaction manually
router.post("/recurring-transactions/:id/execute", asyncHandler(async (req, res) => {
    const id = parsePositiveIntParam(req.params.id, "INVALID_RECURRING_ID");
    try {
        const transaction = await storage.executeRecurringTransaction(id);
        res.status(201).json(transaction);
    } catch (error) {
        if (error instanceof Error && error.message === "Recurring transaction not found") {
            throw new AppError("Recurring transaction not found.", 404, "RECURRING_NOT_FOUND");
        }
        logger.error({ err: error, id }, "Failed to execute recurring transaction");
        throw error;
    }
}));

// Execute all pending recurring transactions
router.post("/recurring-transactions/execute-pending", asyncHandler(async (_req, res) => {
    const transactions = await storage.executePendingRecurringTransactions();
    res.status(201).json({ count: transactions.length, transactions });
}));

// Monthly Obligations (Bidirectional)
// Get monthly accounts payable (Gastos recurrentes pendientes)
router.get("/finance/obligations/payables", asyncHandler(async (req, res) => {
    const parsedQuery = monthlyObligationsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        throw new AppError("year and month must be valid values.", 400, "INVALID_OBLIGATION_QUERY", parsedQuery.error.errors);
    }
    const year = parsedQuery.data.year ?? new Date().getFullYear();
    const month = parsedQuery.data.month ?? new Date().getMonth() + 1;
    const payables = await storage.getMonthlyAccountsPayable(year, month);
    res.json(payables);
}));

// Get monthly accounts receivable (Ingresos recurrentes pendientes)
router.get("/finance/obligations/receivables", asyncHandler(async (req, res) => {
    const parsedQuery = monthlyObligationsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        throw new AppError("year and month must be valid values.", 400, "INVALID_OBLIGATION_QUERY", parsedQuery.error.errors);
    }
    const year = parsedQuery.data.year ?? new Date().getFullYear();
    const month = parsedQuery.data.month ?? new Date().getMonth() + 1;
    const receivables = await storage.getMonthlyAccountsReceivable(year, month);
    res.json(receivables);
}));

// Mark an obligation as paid/collected
router.post("/finance/obligations/:id/pay", asyncHandler(async (req, res) => {
    const templateId = parsePositiveIntParam(req.params.id, "INVALID_TEMPLATE_ID");
    const parsedBody = payObligationSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
        throw new AppError("paidDate must be a valid date.", 400, "INVALID_PAID_DATE", parsedBody.error.errors);
    }
    const paidDate = parsedBody.data.paidDate ? parseQueryDate(parsedBody.data.paidDate) : new Date();
    if (!paidDate) {
        throw new AppError("paidDate must be a valid date.", 400, "INVALID_PAID_DATE");
    }

    try {
        const transaction = await storage.markObligationAsPaid(templateId, paidDate);
        logAction(req, "CREATE", "FINANCE", transaction.id.toString(), `Pagó obligación recurrente (Generó transacción '${transaction.description}')`);
        res.status(201).json(transaction);
    } catch (error) {
        if (error instanceof Error && error.message === "Recurring template not found") {
            throw new AppError("Recurring template not found.", 404, "RECURRING_NOT_FOUND");
        }
        logger.error({ err: error, templateId }, "Failed to mark obligation as paid");
        throw error;
    }
}));

// Revert paid status (delete linked transaction and reset lastExecutionDate)
// FIN-001: Properly delete the transaction, not just hide it
router.post("/finance/obligations/:id/unpay", asyncHandler(async (req, res) => {
    const templateId = parsePositiveIntParam(req.params.id, "INVALID_TEMPLATE_ID");
    try {
        const { transactionDeleted, recurring } = await storage.unpayObligation(templateId);
        if (transactionDeleted) {
            logger.info({ templateId }, "Reverted payment for template");
        }
        logAction(req, "UNPAY", "FINANCE", templateId.toString(), `Deshizo el pago de la obligación recurrente #${templateId}`);
        res.json({
            success: true,
            transactionDeleted,
            recurring,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Recurring template not found") {
            throw new AppError("Recurring template not found.", 404, "RECURRING_NOT_FOUND");
        }
        logger.error({ err: error, templateId }, "Failed to unpay obligation");
        throw error;
    }
}));

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
        const responseBody: Record<string, unknown> = { error: error.message };
        if (error.details !== undefined) {
            responseBody.details = error.details;
        }
        return res.status(error.statusCode).json(responseBody);
    }

    logger.error({ err: error }, "Unhandled financial controller error");
    return res.status(500).json({ error: "Internal server error" });
});

export default router;
