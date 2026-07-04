import jwt from 'jsonwebtoken';
import ChatLog from '../models/ChatLog.js';
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
 * Maps the Gemini-formatted history array to the messages array expected by OpenAI's chat completion API.
 */
const mapHistoryToOpenAIMessages = (sanitizedHistory, systemPrompt, currentMessage) => {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const entry of sanitizedHistory) {
    const role = entry.role === 'model' ? 'assistant' : 'user';
    const content = entry.parts[0].text;
    messages.push({ role, content });
  }

  messages.push({ role: 'user', content: currentMessage });

  return messages;
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

    // ─── Send Message with ChatGPT Model ──────────────────────────
    const apiKey = process.env.CHATGPT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. ChatGPT API key is missing.'
      });
    }

    const messages = mapHistoryToOpenAIMessages(sanitizedHistory, RTUCAI_SYSTEM_PROMPT, trimmedMessage);
    const candidateModels = ['gpt-5.5-mini', 'gpt-4o-mini'];
    let lastError;
    let responseText;
    let workingModel = '';

    logger.info(`Chat request received. Sending to ChatGPT. Message length: ${trimmedMessage.length}`);

    for (const modelName of candidateModels) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
        }

        responseText = data.choices?.[0]?.message?.content;
        if (responseText) {
          workingModel = modelName;
          break; // Success, break model loop
        }
      } catch (err) {
        lastError = err;
        logger.warn(`Model ${modelName} failed. Error: ${err.message}`);

        // If it's an API Key/auth issue, stop retrying other models
        const isAuthError =
          err.message?.includes('invalid_api_key') ||
          err.message?.includes('API key') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('401');

        if (isAuthError) {
          throw err;
        }
      }
    }

    if (!responseText) {
      if (lastError) throw lastError;
      throw new Error('All candidate models failed to generate a response.');
    }

    const cleanedResponseText = sanitizeResponse(responseText);

    // ─── Save Chat Log to Database ─────────────────────────────────
    try {
      let userId = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (err) {
          // Token is invalid/expired, ignore for logging
        }
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      await ChatLog.create({
        user: userId,
        message: trimmedMessage,
        reply: cleanedResponseText,
        model: workingModel,
        ipAddress,
        userAgent
      });
      logger.info('Chat log saved successfully.');
    } catch (dbErr) {
      logger.error('Failed to save chat log to database:', dbErr);
    }

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
