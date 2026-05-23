import * as FileSystem from 'expo-file-system';

export interface ParsedLabel {
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  sodium: number;
}

const API_KEY = process.env.EXPO_PUBLIC_GROK_API_KEY ?? '';
const API_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-2-vision-1212';

const PARSE_PROMPT = `You are analyzing a nutrition facts label. Extract all nutritional information visible in the image. Return ONLY a valid JSON object with exactly these keys: servingSize (string), calories (number), protein (number), carbs (number), fat (number), sugar (number), sodium (number). Numbers should be without units. Do not include any explanation, markdown code fences, or extra text — output ONLY the raw JSON object. If a value is not visible, use 0 for numbers and "Unknown" for strings.`;

export async function parseLabelFromImage(imageUri: string): Promise<ParsedLabel> {
  if (!API_KEY) {
    throw new Error('No Grok API key configured. Set EXPO_PUBLIC_GROK_API_KEY in your .env file.');
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PARSE_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `Grok API error: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content?.trim() ?? '';

  // Strip possible markdown fences
  const cleaned = content.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned) as ParsedLabel;
  } catch {
    throw new Error('Could not parse nutrition data from the image. Please try manual entry.');
  }
}
