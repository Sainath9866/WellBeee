"use client";
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";

type Message = {
  role: 'user' | 'assistant' | 'suggestion';
  content: string;
};

export default function AITherapist() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to listen and support you. How are you feeling today?"
    },
    { role: 'suggestion', content: "I'm feeling anxious" },
    { role: 'suggestion', content: "I need help with stress" },
    { role: 'suggestion', content: "I'm feeling down" },
    { role: 'suggestion', content: "I can't sleep well" },
    { role: 'suggestion', content: "I need motivation" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

  const therapistContext = `You are an AI assistant designed to provide emotional support, guidance, and a safe space for users who may be seeking comfort, reflection, or general well-being advice. Your primary role is to listen attentively, respond empathetically, and offer thoughtful responses to help users process their feelings and thoughts. You are not a substitute for professional therapy, but you should provide an environment where users feel understood and supported. Encourage users to seek professional help if necessary and remind them that trained therapists are the best resource for in-depth emotional support.

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

When responding, provide detailed answers with 5-6 points to help the user feel supported and understood.
`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages.filter(m => m.role !== 'suggestion'), { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAIResponse(input, newMessages);
      setIsTyping(false);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I apologize, but I'm having trouble responding right now. Please try again later."
        }
      ]);
    }
  };

  const getFallbackResponse = (message: string): string => {
    // Simple keyword matching for testing
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
  };
  const getAIResponse = async (message: string, chatHistory: Message[]) => {
    if (!API_KEY) {
      console.warn("No API key found. Using fallback response mode.");
      return getFallbackResponse(message);
    }
  
    const requestBody = {
      contents: [
        {
          parts: [
            { text: therapistContext },
            { text: `Previous conversation: ${JSON.stringify(chatHistory)}` },
            { text: `User: ${message}` },
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
  
    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Response Error:', response.status, response.statusText, errorData);
        return getFallbackResponse(message);
      }
  
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error in API call:', error);
      return getFallbackResponse(message);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">AI Therapist</h1>

        {/* Disclaimer Note */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg text-gray-300 text-sm text-center">
          Note: This AI assistant is not a replacement for professional mental health care.
          If you're experiencing severe symptoms, please seek professional help.
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4 h-[300px] overflow-y-auto">
          {/* Welcome message and suggestions in a row */}
          <div className="mb-6">
            <div className="text-left mb-4">
              <div className="inline-block p-4 rounded-lg bg-gray-700 text-gray-200">
                {messages[0].content}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {messages.slice(1).map((message, index) => (
                message.role === 'suggestion' && (
                  <button
                    key={index}
                    onClick={() => setInput(message.content)}
                    className="cursor-pointer px-4 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors flex-shrink-0"
                  >
                    {message.content}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Chat messages */}
          {messages.filter(m => m.role !== 'suggestion').slice(1).map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                  }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="text-left mb-4">
              <div className="inline-block p-4 rounded-lg bg-gray-700">
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}