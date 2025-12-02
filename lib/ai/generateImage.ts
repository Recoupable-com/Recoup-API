import { GeneratedFile, LanguageModelUsage, ModelMessage } from "ai";
import { createImageGenerationAgent } from "@/lib/agents/ImageGenerationAgent";

const generateImage = async (
  prompt: string,
): Promise<{ image: GeneratedFile; usage: LanguageModelUsage } | null> => {
  try {
    const agent = createImageGenerationAgent();
    const messages = [
      {
        role: "user",
        content: prompt,
      } as ModelMessage,
    ];
    const response = await agent.generate({
      messages,
    });

    return { image: response.files[0], usage: response.usage };
  } catch (error) {
    console.error("Error generating image:", error);
  }
};

export default generateImage;
