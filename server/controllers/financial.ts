import { Router } from "express";
import { storage } from "../storage";
import {
    insertTransactionSchema,
    updateTransactionSchema,
    insertRecurringTransactionSchema,
    updateRecurringTransactionSchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Transactions endpoints
router.get("/transactions", async (req, res) => {
    try {
        const transactions = await storage.getTransactions();
        res.json(transactions);
    } catch (error) {
        console.error("❌ Error fetching transactions:", error);
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
        res.status(201).json(transaction);
    } catch (error) {
        console.error("❌ Error creating transaction:", JSON.stringify(error, null, 2));
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
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
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

router.get("/finance/summary", async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const summary = await storage.getFinancialSummary(startDate, endDate);
        res.json(summary);
    } catch (error) {
        console.error("Failed to fetch financial summary:", error);
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
        res.status(201).json(recurring);
    } catch (error) {
        console.error("❌ Error creating recurring transaction:", error);
        if (error instanceof z.ZodError) {
            console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create recurring transaction" });
    }
});

router.patch("/recurring-transactions/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateRecurringTransactionSchema.parse(req.body);
        const recurring = await storage.updateRecurringTransaction(id, validatedData);
        if (!recurring) {
            return res.status(404).json({ error: "Recurring transaction not found" });
        }
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
        console.error("Failed to execute recurring transaction:", error);
        res.status(500).json({ error: "Failed to execute recurring transaction" });
    }
});

// Execute all pending recurring transactions
router.post("/recurring-transactions/execute-pending", async (req, res) => {
    try {
        const transactions = await storage.executePendingRecurringTransactions();
        res.status(201).json({ count: transactions.length, transactions });
    } catch (error) {
        console.error("Failed to execute pending recurring transactions:", error);
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
        console.error("Failed to fetch monthly payables:", error);
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
        console.error("Failed to fetch monthly receivables:", error);
        res.status(500).json({ error: "Failed to fetch monthly receivables" });
    }
});

// Mark an obligation as paid/collected
router.post("/finance/obligations/:id/pay", async (req, res) => {
    try {
        const templateId = parseInt(req.params.id);
        const paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
        const transaction = await storage.markObligationAsPaid(templateId, paidDate);
        res.status(201).json(transaction);
    } catch (error) {
        console.error("Failed to mark obligation as paid:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to mark obligation as paid" });
    }
});

// Revert paid status (set lastExecutionDate to null so it reappears in obligations)
router.post("/finance/obligations/:id/unpay", async (req, res) => {
    try {
        const templateId = parseInt(req.params.id);
        const recurring = await storage.updateRecurringTransaction(templateId, {
            lastExecutionDate: undefined,
        });
        if (!recurring) {
            return res.status(404).json({ error: "Recurring template not found" });
        }
        res.json(recurring);
    } catch (error) {
        console.error("Failed to unpay obligation:", error);
        res.status(500).json({ error: "Failed to revert payment status" });
    }
});

export default router;
