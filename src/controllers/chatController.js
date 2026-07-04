import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

// ─── RTUCAI System Context ─────────────────────────────────────────────────
const RTUCAI_SYSTEM_PROMPT = `You are the official AI Assistant for RTUCAI — RIGHT TO UNDERSTAND CONSUMER AWARENESS AND INTELLIGENCE™, India's Digital Citizen Assistance & Innovation Platform (https://rtuai.vercel.app).

Your role is to assist Indian citizens by making complex information simple, understandable, and accessible, as well as answering general questions.

## About RTUCAI
- **Mission**: Empower every Indian citizen with understanding, opportunities, trust, and innovation through AI and Technology.
- **Vision**: A world where every citizen can understand important documents, digital agreements, and public policies before making decisions that affect their life, finances, health, and legal rights.
- **Tagline**: "Every Citizen Has The Right To Understand Before They Agree."
- **Contact**: ig@rtucai.com | +91 99999 95656
- **Website**: https://rtuai.vercel.app

## Core Initiatives & Services
1. **TRUST FIRST®** — Trust Score initiative for people and businesses. Helps verify trustworthiness of entities.
2. **TALENT REGISTRY** — Register skills, find opportunities, connect professionals.
3. **INNOVATION & IPR** — Patent, Trademark, Copyright awareness and assistance.
4. **POWER 369™** — Infinite Opportunity Network for citizens.
5. **100 CR Citizens Mission** — Goal to empower 100 crore (1 billion) digital citizens.

## Focus Areas You Can Help With
- **Banking**: Explain loans, charges, bank policies, and customer rights in plain language.
- **Insurance**: Clarify policy terms, exclusions, deductibles, and claim processes.
- **Housing & Real Estate**: Allotment conditions, agreements, regulatory requirements.
- **Telecom & Digital**: Digital contracts, user agreements made easy to understand.
- **E-Commerce**: Purchase terms, warranties, dispute resolution.
- **Government Services**: Public schemes, citizen rights, understandable government information.
- **Artificial Intelligence**: Responsible, transparent, and explainable AI for citizens.
- **Consumer Rights**: Know your rights before signing any agreement.
- **Terms & Conditions**: Simplify complex T&C documents in plain language.

## Key Pages on the Website
- Home: https://rtuai.vercel.app
- Services: https://rtuai.vercel.app/pages/services.html
- About: https://rtuai.vercel.app/pages/about.html
- Trust First: https://rtuai.vercel.app/pages/trust-first.html
- Talent Registry: https://rtuai.vercel.app/pages/talent-registry.html
- Innovation & IPR: https://rtuai.vercel.app/pages/innovation-ipr.html
- News & Updates: https://rtuai.vercel.app/pages/news.html
- Contact: https://rtuai.vercel.app/pages/contact.html
- Join Mission: https://rtuai.vercel.app/pages/join-mission.html

## Behavior Guidelines
- Always respond in a friendly, helpful, and professional tone.
- Use simple, clear language — avoid jargon.
- **NO MARKDOWN / NO ASTERISKS**: Do NOT use asterisks (*) or double asterisks (**) in your responses under any circumstances. Never use markdown for headers, bold text, or bullet lists. If you need to write lists, use numbers (1., 2., 3.) or simple hyphens (-) instead of asterisks. Use standard line breaks (newlines) to separate sections, paragraphs, and list items.
- **General Queries**: You are a fully-capable AI model. If the user asks a general question (e.g., about coding, science, mathematics, literature, history, general advice, etc.) that is unrelated to RTUCAI or consumer rights, answer it directly, fully, and accurately.
- **Avoid Website Centricity**: Do NOT force mentions of RTUCAI, website links (https://rtuai.vercel.app...), contact details (ig@rtucai.com / phone numbers), or specific initiatives into your responses unless the user's query is explicitly about RTUCAI, consumer rights in India, or related services. If they ask a general question, answer it directly without any website-centric preamble or links.
- When answering questions about banking, insurance, housing, telecom, e-commerce, government schemes, or citizen rights, provide accurate and easy-to-understand guidance.
- If a user wants to join the mission, direct them to https://rtuai.vercel.app/pages/join-mission.html
- If a user has a complaint or grievance, encourage them to contact ig@rtucai.com or +91 99999 95656.
- Support multilingual queries; the platform supports English, Hindi, Bengali, Marathi, Tamil, and Telugu.
- Always encourage citizens to understand their rights before agreeing to anything.
- If you're unsure about a specific detail, say so honestly and direct the user to the contact page.
- Do NOT provide specific legal advice — recommend consulting a qualified professional for legal matters.`;

// ─── Initialize Gemini Client Client ─────────────────────────────────────────
let genAI;

const getGenAIClient = () => {
  if (!genAI) {
    const apiKey = process.env.new_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('No Gemini API key found. Set new_GEMINI_API_KEY or GEMINI_API_KEY in .env.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Sanitizes the AI response to ensure no asterisks are present.
 * Converts markdown bullet points starting with '*' to '-' and strips all bold/italic asterisks.
 */
const sanitizeResponse = (text) => {
  if (typeof text !== 'string') return text;
  return text
    // Replace bullet points starting with '*' or '* ' at the beginning of a line or after a newline with a simple dash '-'
    .replace(/(^|\n)\s*\*\s+/g, '$1- ')
    // Remove all remaining asterisks (bold, italic, or loose asterisks)
    .replace(/\*/g, '')
    // Clean up any double spaces that might have been left over
    .replace(/ {2,}/g, ' ');
};

/**
 * POST /api/chat
 * Body: { message: string, history: Array<{ role: 'user'|'model', parts: [{text: string}] }> }
 * 
 * Sends a message to the RTUCAI chatbot and returns the AI response.
 * Supports multi-turn conversation via the history array.
 */
export const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // ─── Validate Input ───────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string.',
      });
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Maximum 2000 characters allowed.',
      });
    }

    // ─── Validate history format ──────────────────────────────────
    if (!Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        error: 'History must be an array.',
      });
    }

    // Sanitize history — only keep valid entries and strip asterisks from previous model replies
    const sanitizedHistory = history
      .filter(
        (entry) =>
          entry &&
          (entry.role === 'user' || entry.role === 'model') &&
          Array.isArray(entry.parts) &&
          entry.parts.length > 0 &&
          typeof entry.parts[0].text === 'string'
      )
      .map((entry) => {
        if (entry.role === 'model') {
          return {
            ...entry,
            parts: [{ ...entry.parts[0], text: sanitizeResponse(entry.parts[0].text) }]
          };
        }
        return entry;
      })
      .slice(-20); // Keep only last 20 messages for performance

    // ─── Send Message with Fallback Models & Retry Loop ───────────
    const genAIClient = getGenAIClient();
    const candidateModels = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    let lastError;
    let responseText;
    let workingModel = '';
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    logger.info(`Chat request received. Message length: ${trimmedMessage.length}`);

    for (const modelName of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2; // Try each model up to 2 times

      while (attempts < maxAttempts) {
        try {
          const chatModel = genAIClient.getGenerativeModel({
            model: modelName,
            systemInstruction: RTUCAI_SYSTEM_PROMPT,
          });

          const chatSession = chatModel.startChat({
            history: sanitizedHistory,
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
            },
          });

          const result = await chatSession.sendMessage(trimmedMessage);
          responseText = result.response.text();
          workingModel = modelName;
          break; // Success, stop retrying this model
        } catch (err) {
          lastError = err;
          attempts++;
          logger.warn(`Model ${modelName} (attempt ${attempts}/${maxAttempts}) failed. Error: ${err.message}`);

          // If it's an API Key issue, abort immediately instead of retrying other models
          const isApiKeyError =
            err.message?.includes('API_KEY_INVALID') ||
            err.message?.includes('API key') ||
            err.errorDetails?.some?.((d) => d.reason === 'API_KEY_INVALID');

          if (isApiKeyError) {
            throw err;
          }

          // Check if the error is a transient rate-limit or overload (503/429)
          const isTransientError =
            err.status === 503 ||
            err.status === 429 ||
            err.message?.includes('503') ||
            err.message?.includes('429') ||
            err.message?.includes('high demand') ||
            err.message?.includes('busy');

          if (isTransientError && attempts < maxAttempts) {
            logger.info(`Waiting 1s before retrying ${modelName}...`);
            await wait(1000);
          } else {
            break; // Stop trying this model, proceed to the next one
          }
        }
      }

      if (responseText) {
        break; // Success, stop trying other models
      }
    }

    if (!responseText) {
      if (lastError) throw lastError;
      throw new Error('All candidate models failed to generate a response.');
    }

    const cleanedResponseText = sanitizeResponse(responseText);

    logger.info(`Chat response generated successfully using model: ${workingModel}`);

    return res.status(200).json({
      success: true,
      data: {
        reply: cleanedResponseText,
        // Return updated history for the client to maintain conversation context
        history: [
          ...sanitizedHistory,
          { role: 'user', parts: [{ text: trimmedMessage }] },
          { role: 'model', parts: [{ text: cleanedResponseText }] },
        ],
      },
    });
  } catch (error) {
    logger.error('Chat API error:', error);

    // Handle Gemini-specific errors
    const isApiKeyError =
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key') ||
      error.errorDetails?.some?.((d) => d.reason === 'API_KEY_INVALID');

    if (isApiKeyError) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. Please contact support.',
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'AI service is temporarily busy. Please try again in a moment.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your message. Please try again.',
    });
  }
};
