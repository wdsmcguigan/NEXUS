import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes

  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Email Accounts
  app.post("/api/accounts", async (req, res) => {
    try {
      const account = await storage.createEmailAccount(req.body);
      res.json(account);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/accounts/user/:userId", async (req, res) => {
    try {
      const accounts = await storage.getEmailAccountsByUserId(Number(req.params.userId));
      res.json(accounts);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Contacts
  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = await storage.createContact(req.body);
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(Number(req.params.id));
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Tags
  app.post("/api/tags", async (req, res) => {
    try {
      const tag = await storage.createTag(req.body);
      res.json(tag);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tags/user/:userId", async (req, res) => {
    try {
      const tags = await storage.getTagsByUserId(Number(req.params.userId));
      res.json(tags);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Emails
  app.post("/api/emails", async (req, res) => {
    try {
      const email = await storage.createEmail(req.body);
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/emails/account/:accountId", async (req, res) => {
    try {
      const categoryFilter = req.query.category as string | undefined;
      const emails = await storage.getEmailsByAccountId(
        Number(req.params.accountId),
        categoryFilter
      );
      res.json(emails);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/emails/:id", async (req, res) => {
    try {
      const email = await storage.getEmailWithDetails(Number(req.params.id));
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/emails/:id/star", async (req, res) => {
    try {
      const { starColor } = req.body;
      const email = await storage.updateEmailStar(Number(req.params.id), starColor);
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const { isRead } = req.body;
      const email = await storage.updateEmailReadStatus(Number(req.params.id), isRead);
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/emails/:id/archive", async (req, res) => {
    try {
      const email = await storage.archiveEmail(Number(req.params.id));
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/emails/:id/trash", async (req, res) => {
    try {
      const email = await storage.trashEmail(Number(req.params.id));
      res.json(email);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Email Tags
  app.post("/api/email-tags", async (req, res) => {
    try {
      const emailTag = await storage.addTagToEmail(req.body);
      res.json(emailTag);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/email-tags/:emailId/:tagId", async (req, res) => {
    try {
      await storage.removeTagFromEmail(
        Number(req.params.emailId),
        Number(req.params.tagId)
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User Preferences
  app.post("/api/preferences", async (req, res) => {
    try {
      const preferences = await storage.saveUserPreferences(req.body);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/preferences/user/:userId", async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(Number(req.params.userId));
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
