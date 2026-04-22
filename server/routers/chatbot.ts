/**
 * Chatbot Router — AI-powered custom order consultation
 */
import { z } from "zod";
import { TRPCError, publicProcedure, router, getClientIp } from "./_shared";
import * as chatbotService from "../chatbot";
import type { Request } from "express";

// ─── Chat Rate Limiting ───────────────────────────────────────────────────────
const buildChatRateKey = (req: Request, sessionId: string) =>
  `${getClientIp(req)}:${sessionId}`;

const enforceChatRateLimit = (
  action: "sendMessage" | "uploadImage",
  req: Request,
  sessionId: string
) => {
  const { allowed, retryAfterMs } = chatbotService.checkChatRateLimit(
    action,
    buildChatRateKey(req, sessionId)
  );
  if (!allowed) {
    const retryAfterSeconds = retryAfterMs
      ? Math.max(1, Math.ceil(retryAfterMs / 1000))
      : 60;
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${retryAfterSeconds}s.`,
    });
  }
};

const assertValidChatImages = (imageDataList: string[]) => {
  for (const imageData of imageDataList) {
    const validation = chatbotService.validateImagePayload(imageData);
    if (!validation.ok) {
      throw new TRPCError({ code: validation.code, message: validation.message });
    }
  }
};

// ─── Router ───────────────────────────────────────────────────────────────────
export const chatbotRouter = router({
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1).max(chatbotService.CHAT_LIMITS.maxSessionIdLength),
        message: z.string().min(1).max(chatbotService.CHAT_LIMITS.maxMessageLength),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(chatbotService.CHAT_LIMITS.maxMessageLength),
            })
          )
          .max(chatbotService.CHAT_LIMITS.maxHistoryMessages)
          .optional(),
        imageUrls: z
          .array(z.string())
          .max(chatbotService.CHAT_LIMITS.maxImagesPerMessage)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceChatRateLimit("sendMessage", ctx.req, input.sessionId);
      if (input.imageUrls && input.imageUrls.length > 0) {
        assertValidChatImages(input.imageUrls);
        const existingImages = chatbotService.getSessionImages(input.sessionId);
        const combinedImages = new Set([...existingImages, ...input.imageUrls]);
        if (combinedImages.size > chatbotService.CHAT_LIMITS.maxImagesPerSession) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You can attach up to ${chatbotService.CHAT_LIMITS.maxImagesPerSession} images per session.`,
          });
        }
      }
      return await chatbotService.processChat(input);
    }),

  uploadImage: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(1).max(chatbotService.CHAT_LIMITS.maxSessionIdLength),
        imageData: z.string().min(1),
        fileName: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceChatRateLimit("uploadImage", ctx.req, input.sessionId);
      const validation = chatbotService.validateImagePayload(input.imageData);
      if (!validation.ok) {
        throw new TRPCError({ code: validation.code, message: validation.message });
      }
      const existingImages = chatbotService.getSessionImages(input.sessionId);
      if (existingImages.length >= chatbotService.CHAT_LIMITS.maxImagesPerSession) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can upload up to ${chatbotService.CHAT_LIMITS.maxImagesPerSession} images per session.`,
        });
      }
      return await chatbotService.uploadImage(input.sessionId, input.imageData, input.fileName);
    }),

  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return await chatbotService.getConversationHistory(input.sessionId);
    }),
});
