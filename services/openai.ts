
import { ChatMessage } from "../types";

export const chatWithOpenAI = async (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemInstruction?: string
) => {
  const url = "https://api.openai.com/v1/chat/completions";

  // Convert internal ChatMessage format to OpenAI format
  const apiMessages = [];
  
  if (systemInstruction) {
    apiMessages.push({ role: "system", content: systemInstruction });
  }

  messages.forEach(m => {
    let content: any = m.text;
    
    // Handle images if present
    if (m.images && m.images.length > 0) {
      content = [
        { type: "text", text: m.text },
        ...m.images.map(img => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${img}`
          }
        }))
      ];
    }

    apiMessages.push({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: content
    });
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API Error");
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || "",
      usage: data.usage
    };

  } catch (error) {
    console.error("OpenAI Call Failed:", error);
    throw error;
  }
};
