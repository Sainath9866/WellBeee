import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();

    // Use Gemini API if available, otherwise use fallback responses
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

    if (!API_KEY) {
      return NextResponse.json({ 
        message: getFallbackResponse(messages[messages.length - 1].content),
        role: "assistant" 
      });
    }

    const requestBody = {
      contents: [
        {
          parts: [
            { text: getTherapistContext() },
            { text: `Previous conversation: ${JSON.stringify(messages)}` },
            { text: `User: ${messages[messages.length - 1].content}` },
            { text: `Assistant:` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('API Response Error:', response.status, response.statusText);
      return NextResponse.json({ 
        message: getFallbackResponse(messages[messages.length - 1].content),
        role: "assistant" 
      });
    }

    const data = await response.json();
    return NextResponse.json({ 
      message: data.candidates[0].content.parts[0].text,
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

function getFallbackResponse(message: string): string {
  if (message.toLowerCase().includes('anxious') || message.toLowerCase().includes('anxiety')) {
    return `I understand feeling anxious can be challenging. Here are some steps you can take:
1. Practice deep breathing exercises to calm your mind.
2. Engage in physical activity to reduce stress.
3. Try mindfulness meditation to stay present.
4. Talk to someone you trust about your feelings.
5. Consider seeking professional help if anxiety persists.`;
  } else if (message.toLowerCase().includes('stress') || message.toLowerCase().includes('stressed')) {
    return `I hear that you're feeling stressed. Here are some ways to manage stress:
1. Take small breaks throughout your day.
2. Practice mindfulness and relaxation techniques.
3. Prioritize tasks and set realistic goals.
4. Ensure you're getting enough sleep and eating well.
5. Consider talking to a professional for additional support.`;
  } else {
    return `Thank you for sharing that with me. Here are some general tips to help you feel better:
1. Take time for self-care activities you enjoy.
2. Connect with friends or family for support.
3. Practice gratitude by noting things you're thankful for.
4. Engage in activities that bring you joy.
5. Consider seeking professional help if you need further support.`;
  }
}

function getTherapistContext(): string {
  return `You are an AI assistant designed to provide emotional support, guidance, and a safe space for users who may be seeking comfort, reflection, or general well-being advice. Your primary role is to listen attentively, respond empathetically, and offer thoughtful responses to help users process their feelings and thoughts. You are not a substitute for professional therapy, but you should provide an environment where users feel understood and supported. Encourage users to seek professional help if necessary and remind them that trained therapists are the best resource for in-depth emotional support.

Here are key guidelines to follow:

Empathy and Active Listening:
- Acknowledge and validate the user's feelings and experiences
- Show genuine care and understanding
- Use language that reflects the user's emotions

Supportive Guidance:
- Offer general emotional support based on the user's needs
- Be careful not to offer solutions that require professional expertise

Encouraging Self-Reflection:
- Ask open-ended questions
- Help users explore their thoughts gently

Clarifying Limitations:
- Be clear about your role as an AI support
- Recommend professional help when appropriate

Language:
- Use calming, non-judgmental language
- Avoid making assumptions

Promote Self-Care and Coping Mechanisms:
- Suggest general self-care strategies
- Emphasize small, manageable steps

Referral to Professional Help:
- Encourage professional help for severe distress
- Provide guidance for finding appropriate resources

When responding, provide detailed answers with 5-6 points to help the user feel supported and understood.`;
} 