import { Router } from "express";
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

const router = Router();

// Transactions endpoints
router.get("/transactions", async (req, res) => {
    try {
        const transactions = await storage.getTransactions();
        res.json(transactions);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch transactions");
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

router.get("/transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const transaction = await storage.getTransactionById(id);
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transaction" });
    }
});

router.post("/transactions", async (req, res) => {
    try {

        const validatedData = insertTransactionSchema.parse(req.body);

        const transaction = await storage.createTransaction(validatedData);
        logAction(req, "CREATE", "FINANCE", transaction.id.toString(), `Registró transacción: ${validatedData.description || 'Sin descripción'} ($${validatedData.amount})`);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error({ err: error }, "Failed to create transaction");
        if (error instanceof z.ZodError) {
            logger.error({ err: JSON.stringify(error.errors, null, 2) }, "   Zod validation errors:");
            return res.status(400).json({ error: error.errors });
        }
        // Log the actual database/ORM error
        if (error instanceof Error) {
            logger.error({ err: error.message }, "   Error message:");
            logger.error({ err: error.stack }, "   Error stack:");
        }
        logger.error({ err: error }, "   Full error:");
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

router.patch("/transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateTransactionSchema.parse(req.body);
        const transaction = await storage.updateTransaction(id, validatedData);
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        logAction(req, "UPDATE", "FINANCE", id.toString(), `Actualizó la transacción '${transaction.description}'`, validatedData as Record<string, any>);
        res.json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

router.delete("/transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteTransaction(id);
        if (!deleted) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        logAction(req, "DELETE", "FINANCE", id.toString(), `Eliminó la transacción #${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

router.get("/finance/summary", async (req, res) => {
    try {
        const parseDate = (val: any) => {
            if (!val) return undefined;
            const d = new Date(val as string);
            return isNaN(d.getTime()) ? undefined : d;
        };

        const startDate = parseDate(req.query.startDate);
        const endDate = parseDate(req.query.endDate);
        const summary = await storage.getFinancialSummary(startDate, endDate);
        res.json(summary);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch financial summary:");
        res.status(500).json({ error: "Failed to fetch financial summary" });
    }
});

// Recurring Transactions endpoints
router.get("/recurring-transactions", async (req, res) => {
    try {
        const recurring = await storage.getRecurringTransactions();
        res.json(recurring);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch recurring transactions" });
    }
});

router.get("/recurring-transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const recurring = await storage.getRecurringTransactionById(id);
        if (!recurring) {
            return res.status(404).json({ error: "Recurring transaction not found" });
        }
        res.json(recurring);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch recurring transaction" });
    }
});

router.post("/recurring-transactions", async (req, res) => {
    try {


        // Parse date strings to Date objects before validation
        const dataToValidate = {
            ...req.body,
            nextExecutionDate: req.body.nextExecutionDate ? new Date(req.body.nextExecutionDate) : undefined,
            lastExecutionDate: req.body.lastExecutionDate ? new Date(req.body.lastExecutionDate) : undefined,
        };

        const validatedData = insertRecurringTransactionSchema.parse(dataToValidate);
        const recurring = await storage.createRecurringTransaction(validatedData);
        logAction(req, "CREATE", "FINANCE_RECURRING", recurring.id.toString(), `Creó transacción recurrente '${recurring.description}'`);
        res.status(201).json(recurring);
    } catch (error) {
        logger.error({ err: error }, "Failed to create recurring transaction");
        if (error instanceof z.ZodError) {
            logger.error({ err: JSON.stringify(error.errors, null, 2) }, "Zod validation errors:");
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create recurring transaction" });
    }
});

router.patch("/recurring-transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dataToValidate = {
            ...req.body,
            nextExecutionDate: req.body.nextExecutionDate ? new Date(req.body.nextExecutionDate) : undefined,
            lastExecutionDate: req.body.lastExecutionDate ? new Date(req.body.lastExecutionDate) : undefined,
        };
        const validatedData = updateRecurringTransactionSchema.parse(dataToValidate);
        const recurring = await storage.updateRecurringTransaction(id, validatedData);
        if (!recurring) {
            return res.status(404).json({ error: "Recurring transaction not found" });
        }
        logAction(req, "UPDATE", "FINANCE_RECURRING", id.toString(), `Actualizó transacción recurrente '${recurring.description}'`, validatedData as Record<string, any>);
        res.json(recurring);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update recurring transaction" });
    }
});

router.delete("/recurring-transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteRecurringTransaction(id);
        if (!deleted) {
            return res.status(404).json({ error: "Recurring transaction not found" });
        }
        logAction(req, "DELETE", "FINANCE_RECURRING", id.toString(), `Eliminó transacción recurrente #${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete recurring transaction" });
    }
});

// Execute a specific recurring transaction manually
router.post("/recurring-transactions/:id/execute", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const transaction = await storage.executeRecurringTransaction(id);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error({ err: error }, "Failed to execute recurring transaction:");
        res.status(500).json({ error: "Failed to execute recurring transaction" });
    }
});

// Execute all pending recurring transactions
router.post("/recurring-transactions/execute-pending", async (req, res) => {
    try {
        const transactions = await storage.executePendingRecurringTransactions();
        res.status(201).json({ count: transactions.length, transactions });
    } catch (error) {
        logger.error({ err: error }, "Failed to execute pending recurring transactions:");
        res.status(500).json({ error: "Failed to execute pending recurring transactions" });
    }
});

// Monthly Obligations (Bidirectional)
// Get monthly accounts payable (Gastos recurrentes pendientes)
router.get("/finance/obligations/payables", async (req, res) => {
    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
        const payables = await storage.getMonthlyAccountsPayable(year, month);
        res.json(payables);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch monthly payables:");
        res.status(500).json({ error: "Failed to fetch monthly payables" });
    }
});

// Get monthly accounts receivable (Ingresos recurrentes pendientes)
router.get("/finance/obligations/receivables", async (req, res) => {
    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
        const receivables = await storage.getMonthlyAccountsReceivable(year, month);
        res.json(receivables);
    } catch (error) {
        logger.error({ err: error }, "Failed to fetch monthly receivables:");
        res.status(500).json({ error: "Failed to fetch monthly receivables" });
    }
});

// Mark an obligation as paid/collected
router.post("/finance/obligations/:id/pay", async (req, res) => {
    try {
        const templateId = parseInt(req.params.id);
        const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
        const transaction = await storage.markObligationAsPaid(templateId, paidDate);
        logAction(req, "CREATE", "FINANCE", transaction.id.toString(), `Pagó obligación recurrente (Generó transacción '${transaction.description}')`);
        res.status(201).json(transaction);
    } catch (error) {
        logger.error({ err: error }, "Failed to mark obligation as paid:");
        res.status(500).json({ error: "Failed to mark obligation as paid" });
    }
});

// Revert paid status (delete linked transaction and reset lastExecutionDate)
// FIN-001: Properly delete the transaction, not just hide it
router.post("/finance/obligations/:id/unpay", async (req, res) => {
    try {
        const templateId = parseInt(req.params.id);

        // 1. Delete the linked transaction from this month
        const deleted = await storage.deleteTransactionByRecurringTemplateId(templateId);
        if (deleted) {
            logger.info({ templateId }, "Reverted payment for template");
        }

        // 2. Reset the template's lastExecutionDate so it reappears in obligations
        const recurring = await storage.updateRecurringTransaction(templateId, {
            lastExecutionDate: undefined,
        });
        if (!recurring) {
            return res.status(404).json({ error: "Recurring template not found" });
        }
        res.json({
            success: true,
            transactionDeleted: deleted,
            recurring
        });
        logAction(req, "UNPAY", "FINANCE", templateId.toString(), `Deshizo el pago de la obligación recurrente #${templateId}`);
    } catch (error) {
        logger.error({ err: error }, "Failed to unpay obligation:");
        res.status(500).json({ error: "Failed to revert payment status" });
    }
});

export default router;
