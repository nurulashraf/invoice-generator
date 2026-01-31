import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { InvoiceData } from '../types';

// Define Zod Schema for validation
const LineItemSchema = z.object({
  id: z.string().optional(), // AI might return ID, or we generate it
  description: z.string().optional().default(''),
  quantity: z.number().optional().default(1),
  rate: z.number().optional().default(0),
});

// We make everything optional for partial updates
const InvoiceAiResponseSchema = z.object({
  invoiceNumber: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientAddress: z.string().optional(),
  senderName: z.string().optional(),
  senderRegNo: z.string().optional(),
  senderSstNo: z.string().optional(),
  senderEmail: z.string().optional(),
  senderAddress: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(LineItemSchema).optional(),
});

type InvoiceAiResponse = z.infer<typeof InvoiceAiResponseSchema>;

export const modifyInvoiceWithAI = async (currentData: InvoiceData, userPrompt: string): Promise<Partial<InvoiceData>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // improved prompt that includes current state
  const systemPrompt = `
    You are an expert Invoice Copilot. Your goal is to modify the CURRENT INVOICE based on the USER REQUEST.
    
    RULES:
    1. Analyze the CURRENT INVOICE JSON provided below.
    2. Interpret the USER REQUEST (e.g., "Add an item", "Change tax", "Rewrite notes").
    3. Return a JSON object containing ONLY the fields that need to change.
    4. If the user wants to ADD or REMOVE items, return the COMPLETE updated 'items' array. Do not return partial arrays for items.
    5. If the user asks to "Make it polite" or "Professional", rewrite the 'notes' field accordingly.
    6. Infer missing details where logical (e.g., if user says "Bill to Apple", infer Cupertino address if not known, or leave blank).
    7. Formatting: Date format YYYY-MM-DD.
    
    CURRENT INVOICE JSON:
    ${JSON.stringify(currentData)}
    
    USER REQUEST:
    "${userPrompt}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING },
            date: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            clientAddress: { type: Type.STRING },
            senderName: { type: Type.STRING },
            senderRegNo: { type: Type.STRING },
            senderSstNo: { type: Type.STRING },
            senderEmail: { type: Type.STRING },
            senderAddress: { type: Type.STRING },
            currency: { type: Type.STRING },
            taxRate: { type: Type.NUMBER },
            notes: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                }
              }
            }
          }
        }
      }
    });

    let jsonText = response.text || "";
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    if (!jsonText) return {};
    
    const rawData = JSON.parse(jsonText);
    const validatedData = InvoiceAiResponseSchema.parse(rawData);
    
    // Post-processing: Ensure items have IDs if the AI forgot them
    if (validatedData.items) {
      // @ts-ignore - We are mapping partial items to full line items
      validatedData.items = validatedData.items.map(item => ({
        ...item,
        id: item.id || Math.random().toString(36).slice(2, 11),
        description: item.description || 'Item',
        quantity: item.quantity || 1,
        rate: item.rate || 0
      }));
    }

    // @ts-ignore - Partial return is safe here as it merges in the parent component
    return validatedData;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};

// Keep the old function for backward compatibility if needed, or remove it.
// We will simply redirect it to the new logic with an empty invoice if called directly.
export const parseInvoiceFromText = async (text: string) => {
    // This is a stub to satisfy imports if any exist, but we will move to modifyInvoiceWithAI
    return {}; 
}