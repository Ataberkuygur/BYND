import OpenAI from 'openai';
import { env } from '../utils/env';

const isDummy = env.OPENAI_API_KEY === 'dummy';
let client: OpenAI | null = null;
if (!isDummy) {
  client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export interface InterpretedTask {
  title: string;
  dueAt?: string;
  description?: string;
}

export async function interpretUserUtterance(utterance: string): Promise<InterpretedTask[]> {
  // Enhanced dummy fallback with better parsing
  const dummyFallback = (): InterpretedTask[] => {
    const tasks: InterpretedTask[] = [];
    // Better parsing for common task patterns
    const taskPatterns = [
      /(?:add|create|make|schedule)\s+(.+?)(?:\s+(?:by|for|at|on)\s+(.+?))?$/i,
      /(?:remind me to|need to|have to)\s+(.+?)(?:\s+(?:by|for|at|on)\s+(.+?))?$/i,
      /(.+?)(?:\s+(?:by|for|at|on)\s+(.+?))?$/i
    ];
    
    let matched = false;
    for (const pattern of taskPatterns) {
      const match = utterance.match(pattern);
      if (match) {
        const title = match[1]?.trim();
        const timeStr = match[2]?.trim();
        
        if (title) {
          let dueAt: string | undefined;
          if (timeStr) {
            dueAt = parseTimeString(timeStr);
          }
          
          tasks.push({ 
            title: title.charAt(0).toUpperCase() + title.slice(1),
            dueAt,
            description: timeStr ? `Due: ${timeStr}` : undefined
          });
          matched = true;
          break;
        }
      }
    }
    
    if (!matched) {
      // Fallback to simple task creation
      tasks.push({ 
        title: utterance.charAt(0).toUpperCase() + utterance.slice(1),
        description: 'Created from voice command'
      });
    }
    
    return tasks;
  };
  
  // Helper function to parse time strings
  const parseTimeString = (timeStr: string): string | undefined => {
    const now = new Date();
    let base = new Date();
    
    // Handle relative dates
    if (/tomorrow/i.test(timeStr)) {
      base = new Date(now.getTime() + 24*60*60*1000);
    } else if (/today/i.test(timeStr)) {
      base = new Date();
    } else if (/next week/i.test(timeStr)) {
      base = new Date(now.getTime() + 7*24*60*60*1000);
    }
    
    // Handle specific times
    const timeMatch = timeStr.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\b/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const mer = timeMatch[3]?.toLowerCase();
      
      if (mer === 'pm' && hour < 12) hour += 12;
      if (mer === 'am' && hour === 12) hour = 0;
      
      base.setHours(hour, minute, 0, 0);
      return base.toISOString();
    } else if (/morning/i.test(timeStr)) {
      base.setHours(9, 0, 0, 0);
      return base.toISOString();
    } else if (/afternoon/i.test(timeStr)) {
      base.setHours(14, 0, 0, 0);
      return base.toISOString();
    } else if (/evening/i.test(timeStr)) {
      base.setHours(18, 0, 0, 0);
      return base.toISOString();
    }
    
    return undefined;
  };

  if (isDummy) {
    return dummyFallback();
  }

  try {
    const system = `You are a task interpreter. Convert natural language into JSON array of tasks.
Each task should have:
- title (string, required): Clear, actionable task title
- dueAt (string, optional): ISO8601 datetime if mentioned
- description (string, optional): Additional details

Examples:
"Call mom tomorrow at 3pm" -> [{"title": "Call mom", "dueAt": "2024-01-15T15:00:00.000Z"}]
"Buy groceries and clean house" -> [{"title": "Buy groceries"}, {"title": "Clean house"}]

Only return valid JSON array, no other text.`;
    
    const completion = await client!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [ 
        { role: 'system', content: system }, 
        { role: 'user', content: utterance } 
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    
    const text = completion.choices[0].message.content?.trim() || '[]';
    
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate each task has required fields
        const validTasks = parsed.filter(task => 
          task && typeof task === 'object' && 
          typeof task.title === 'string' && 
          task.title.trim().length > 0
        );
        return validTasks.length > 0 ? validTasks : dummyFallback();
      }
      return dummyFallback();
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError, 'Response:', text);
      return dummyFallback();
    }
  } catch (apiError) {
    console.error('OpenAI API error in interpretUserUtterance:', apiError);
    return dummyFallback();
  }
}

export async function futureSelfResponse(context: string): Promise<string> {
  // Enhanced dummy fallback with more variety
  const dummyFallback = (context: string): string => {
    const templates = [
      (c: string) => `Future You: Stay focused – ${c.toLowerCase().includes('encourage') ? 'you already have the spark; turn it into one concrete action right now.' : 'decide the single next atomic step and do it before you switch contexts.'}`,
      (c: string) => `Future You: Small consistent moves beat bursts. Turn "${c.slice(0,60)}" into a 10‑minute starter task and begin.`,
      (c: string) => `Future You: Remove friction. What blocks "${c.slice(0,50)}"? Eliminate one obstacle in the next 5 minutes.`,
      (c: string) => `Future You: Breathe, prioritize, execute. One thing that matters most about "${c.slice(0,50)}" — do that first.`,
      (c: string) => `Future You: Progress over perfection. What's the smallest step you can take on "${c.slice(0,50)}" right now?`,
      (c: string) => `Future You: Trust the process. Break "${c.slice(0,50)}" into tiny wins and celebrate each one.`
    ];
    const pick = templates[Math.floor(Math.random()*templates.length)];
    return pick(context);
  };

  if (isDummy) {
    return dummyFallback(context);
  }

  try {
    const system = `You are the user's wiser, more experienced future self speaking from a place of growth and success. 

Your role:
- Provide encouraging, actionable guidance
- Be concise but meaningful (80-120 words max)
- Focus on practical next steps
- Acknowledge their current situation with empathy
- Share wisdom from experience
- Use a warm, supportive tone

Avoid:
- Generic advice
- Being preachy or condescending
- Overwhelming them with too many suggestions
- Dismissing their concerns

Start responses with "Future You:" to maintain the persona.`;
    
    const completion = await client!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [ 
        { role: 'system', content: system }, 
        { role: 'user', content: context } 
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    const response = completion.choices[0].message.content?.trim();
    
    if (!response || response.length === 0) {
      return dummyFallback(context);
    }
    
    // Ensure response starts with "Future You:" if it doesn't already
    if (!response.startsWith('Future You:')) {
      return `Future You: ${response}`;
    }
    
    return response;
  } catch (apiError) {
    console.error('OpenAI API error in futureSelfResponse:', apiError);
    return dummyFallback(context);
  }
}
