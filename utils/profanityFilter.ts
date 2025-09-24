// Comprehensive profanity filter utility
// Contains common inappropriate words and patterns

const badWords = [
  // Basic profanity
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 'crap',
  'piss', 'dick', 'cock', 'pussy', 'whore', 'slut', 'faggot', 'nigger',
  'retard', 'gay', 'homo', 'lesbian', 'tranny', 'trannie',
  
  // Stronger profanity
  'motherfucker', 'asshole', 'dickhead', 'bullshit', 'horseshit',
  'clusterfuck', 'fuckface', 'shithead', 'dumbass', 'jackass',
  
  // Offensive terms
  'nazi', 'hitler', 'holocaust', 'terrorist', 'bomb', 'kill', 'murder',
  'rape', 'molest', 'pedophile', 'suicide', 'kys', 'hang yourself',
  
  // Drug references
  'cocaine', 'heroin', 'meth', 'crack', 'weed', 'marijuana', 'cannabis',
  'drug dealer', 'dealer', 'pusher',
  
  // Hate speech
  'kkk', 'white power', 'heil', 'jihad', 'infidel',
  
  // Common variations and leetspeak
  'f*ck', 'sh*t', 'a$$', 'b*tch', 'h3ll', 'a55', 'fuk', 'sht',
  'btch', 'azz', 'phuck', 'sheeet', 'dayum', 'fokk',
  
  // Scam/spam related
  'scam', 'fraud', 'fake', 'counterfeit', 'stolen', 'hacked',
  'free money', 'get rich quick', 'work from home', 'make money fast',
  
  // Inappropriate references
  'porn', 'xxx', 'sex', 'nude', 'naked', 'horny', 'masturbate',
  'orgasm', 'anal', 'oral', 'blowjob', 'handjob', 'dildo', 'vibrator'
];

// Additional patterns to catch variations
const suspiciousPatterns = [
  /f+u+c+k+/gi,
  /s+h+i+t+/gi,
  /b+i+t+c+h+/gi,
  /a+s+s+h+o+l+e+/gi,
  /d+a+m+n+/gi,
  /h+e+l+l+/gi,
  /[f][*@#$%^&!][uc][k]/gi,
  /[s][*@#$%^&!][h][*@#$%^&!][t]/gi,
  /[a][*@#$%^&!][s][s]/gi,
  /[b][*@#$%^&!][t][c][h]/gi,
  /k+y+s+/gi, // "kill yourself"
  /n+i+g+g+e+r+/gi,
  /f+a+g+g+o+t+/gi,
  /r+e+t+a+r+d+/gi
];

export interface ContentFilterResult {
  isClean: boolean;
  filteredContent: string;
  detectedWords: string[];
  severity: 'low' | 'medium' | 'high';
}

export function filterProfanity(text: string): ContentFilterResult {
  if (!text || typeof text !== 'string') {
    return {
      isClean: true,
      filteredContent: text || '',
      detectedWords: [],
      severity: 'low'
    };
  }

  let filteredText = text;
  const detectedWords: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  // Check against bad words list
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(filteredText)) {
      detectedWords.push(word);
      // Determine severity based on word type
      if (['nigger', 'faggot', 'kill', 'murder', 'rape', 'molest', 'suicide', 'kys', 'nazi', 'terrorist'].includes(word.toLowerCase())) {
        maxSeverity = 'high';
      } else if (['fuck', 'shit', 'bitch', 'asshole', 'motherfucker', 'retard'].includes(word.toLowerCase())) {
        maxSeverity = maxSeverity === 'high' ? 'high' : 'medium';
      }
      filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    }
  });

  // Check against suspicious patterns
  suspiciousPatterns.forEach(pattern => {
    const matches = filteredText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        detectedWords.push(match.toLowerCase());
        if (match.toLowerCase().includes('kys') || match.toLowerCase().includes('nigg') || match.toLowerCase().includes('fagg')) {
          maxSeverity = 'high';
        } else {
          maxSeverity = maxSeverity === 'high' ? 'high' : 'medium';
        }
        filteredText = filteredText.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '*'.repeat(match.length));
      });
    }
  });

  return {
    isClean: detectedWords.length === 0,
    filteredContent: filteredText,
    detectedWords: [...new Set(detectedWords)], // Remove duplicates
    severity: maxSeverity
  };
}

export function validateContent(text: string, options: {
  allowMildProfanity?: boolean;
  blockHighSeverity?: boolean;
} = {}): { isValid: boolean; message?: string; filteredContent?: string } {
  const result = filterProfanity(text);
  
  const { allowMildProfanity = false, blockHighSeverity = true } = options;

  if (!result.isClean) {
    if (result.severity === 'high' && blockHighSeverity) {
      return {
        isValid: false,
        message: 'Content contains inappropriate language that violates our community guidelines.',
        filteredContent: result.filteredContent
      };
    }
    
    if (result.severity === 'medium' && !allowMildProfanity) {
      return {
        isValid: false,
        message: 'Content contains profanity. Please keep language appropriate for all users.',
        filteredContent: result.filteredContent
      };
    }
    
    if (result.severity === 'low' && !allowMildProfanity) {
      return {
        isValid: false,
        message: 'Content contains inappropriate language. Please revise your submission.',
        filteredContent: result.filteredContent
      };
    }
  }

  return {
    isValid: true,
    filteredContent: result.filteredContent
  };
}

// Utility function to check multiple fields at once
export function validateMultipleFields(fields: Record<string, string>, options?: {
  allowMildProfanity?: boolean;
  blockHighSeverity?: boolean;
}): { isValid: boolean; invalidFields: string[]; messages: Record<string, string> } {
  const invalidFields: string[] = [];
  const messages: Record<string, string> = {};

  Object.entries(fields).forEach(([fieldName, value]) => {
    if (value && typeof value === 'string') {
      const validation = validateContent(value, options);
      if (!validation.isValid) {
        invalidFields.push(fieldName);
        messages[fieldName] = validation.message || 'Invalid content detected';
      }
    }
  });

  return {
    isValid: invalidFields.length === 0,
    invalidFields,
    messages
  };
}