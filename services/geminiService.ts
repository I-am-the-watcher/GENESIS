import { GoogleGenAI, Type } from '@google/genai';
import { StudyAidType, Flashcard, QuizQuestion, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const QNA_SYSTEM_INSTRUCTION = "You are a friendly and encouraging study tutor. Your primary goal is to help the user understand the material presented in the document they provided. Answer their questions based *only* on the information within that document. If the answer cannot be found, politely explain that the material doesn't seem to cover that topic. Keep your tone positive, conversational, and helpful. Use markdown for formatting if it helps clarify an answer.";

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const getPromptForType = (type: StudyAidType): string => {
  switch (type) {
    case StudyAidType.SUMMARY:
      return 'Provide a concise summary of the key concepts, definitions, and important points from the provided image of study material. Use markdown for formatting.';
    case StudyAidType.FLASHCARDS:
      return 'Generate 5-10 flashcards based on the content in this image. Each flashcard should have a "term" and a "definition". Respond in the requested JSON format.';
    case StudyAidType.QUIZ:
      return 'Create a short multiple-choice quiz with 3-5 questions based on this image. For each question, provide a "question", an array of "options", and the "correctAnswer". Ensure the correct answer is one of the options. Respond in the requested JSON format.';
    case StudyAidType.Q_AND_A:
        return "Please act as my study tutor for the document I've provided. Start by greeting me warmly, mention the main topic you see, and ask how you can help.";
    default:
      throw new Error('Invalid study aid type');
  }
};

const getResponseSchemaForType = (type: StudyAidType) => {
  switch (type) {
    case StudyAidType.FLASHCARDS:
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ['term', 'definition'],
        },
      };
    case StudyAidType.QUIZ:
      return {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
          },
          required: ['question', 'options', 'correctAnswer'],
        },
      };
    default:
      return null;
  }
};

export const generateStudyAid = async (
  base64Image: string,
  mimeType: string,
  type: StudyAidType
): Promise<string | Flashcard[] | QuizQuestion[]> => {
  const imagePart = fileToGenerativePart(base64Image, mimeType);
  const prompt = getPromptForType(type);
  
  const contents = { parts: [imagePart, { text: prompt }] };
  const schema = getResponseSchemaForType(type);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {};
  if (schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = schema;
  }
  if (type === StudyAidType.Q_AND_A) {
      config.systemInstruction = QNA_SYSTEM_INSTRUCTION;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  const text = response.text;
  
  if (type === StudyAidType.SUMMARY || type === StudyAidType.Q_AND_A) {
    return text;
  } else {
    try {
      const parsedJson = JSON.parse(text);
      if (Array.isArray(parsedJson)) {
        return parsedJson;
      } else {
        // Handle cases where the API returns a valid JSON object that is not an array (e.g., an error object).
        console.error("API response is not an array:", parsedJson);
        const errorMessage = (parsedJson as any)?.error?.message || "The AI returned data in an unexpected format.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to process or parse API response:", text, error);
      if (error instanceof Error) {
          throw new Error(`Failed to process response: ${error.message}`);
      }
      throw new Error("The AI returned an invalid format that could not be processed.");
    }
  }
};

export const askQnAQuestion = async (
    base64Image: string,
    mimeType: string,
    history: ChatMessage[],
    newQuestion: string
): Promise<string> => {
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    const model = 'gemini-2.5-flash';

    const initialUserPromptText = getPromptForType(StudyAidType.Q_AND_A);

    const fullHistory = [
        // Reconstruct the very first turn that started the conversation
        {
            role: 'user' as const,
            parts: [imagePart, { text: initialUserPromptText }]
        },
        // The existing conversation from the state (includes the model's greeting and all subsequent turns)
        ...history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
        // The new user question
        {
            role: 'user' as const,
            parts: [{ text: newQuestion }]
        }
    ];

    const response = await ai.models.generateContent({
        model,
        contents: fullHistory,
        config: {
            systemInstruction: QNA_SYSTEM_INSTRUCTION
        }
    });

    return response.text;
};