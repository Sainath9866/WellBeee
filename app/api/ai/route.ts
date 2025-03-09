import { HfInference } from '@huggingface/inference';
import { NextResponse } from "next/server";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Convert chat history to a prompt
    const prompt = messages.map((msg: any) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // Add context to the prompt
    const fullPrompt = `You are a supportive and empathetic AI therapist. Your goal is to help users process their thoughts and feelings in a safe, non-judgmental way. Please respond to the following conversation:\n\n${prompt}\n\nAssistant:`;

    // Use a suitable model for conversation
    const response = await hf.textGeneration({
      model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5', // A good open-source model for conversations
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.2
      }
    });

    return NextResponse.json({ 
      message: response.generated_text,
      role: "assistant" 
    });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
} 