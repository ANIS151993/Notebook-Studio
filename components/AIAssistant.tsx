"use client";

import { useState } from "react";

type AIAssistantProps = {
  code: string;
  error: string | null;
};

type Suggestion = {
  type: 'error' | 'warning' | 'tip';
  message: string;
  solution?: string;
};

export default function AIAssistant({ code, error }: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const analyzecode = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const lines = code.split('\n');

    // Check for common syntax errors
    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Missing colon in control structures
      if (/^(if|for|while|def|class|try|except|with)\s+.*[^:]$/.test(trimmed) && !trimmed.startsWith('#')) {
        suggestions.push({
          type: 'error',
          message: `Line ${index + 1}: Missing colon (:) at end of control structure`,
          solution: `Add a colon at the end: "${trimmed}:"`
        });
      }

      // Unclosed parentheses/brackets
      const opens = (line.match(/[\(\[\{]/g) || []).length;
      const closes = (line.match(/[\)\]\}]/g) || []).length;
      if (opens !== closes) {
        suggestions.push({
          type: 'warning',
          message: `Line ${index + 1}: Mismatched parentheses or brackets`,
          solution: 'Check your opening and closing brackets'
        });
      }

      // Common pandas methods
      if (trimmed.includes('df.') && !trimmed.includes('df.head') && !trimmed.includes('df.tail')) {
        if (trimmed.includes('df.drop')) {
          suggestions.push({
            type: 'tip',
            message: `Line ${index + 1}: Using df.drop()`,
            solution: 'Remember to use inplace=True or reassign: df = df.drop(...)'
          });
        }
      }
    });

    // Parse runtime error
    if (error) {
      if (error.includes('NameError')) {
        suggestions.push({
          type: 'error',
          message: 'Variable not found',
          solution: 'Make sure the variable is defined before using it. Check spelling and case sensitivity.'
        });
      } else if (error.includes('SyntaxError')) {
        suggestions.push({
          type: 'error',
          message: 'Syntax error detected',
          solution: 'Check for missing colons, parentheses, or quotes. Python is case-sensitive.'
        });
      } else if (error.includes('IndentationError')) {
        suggestions.push({
          type: 'error',
          message: 'Indentation error',
          solution: 'Python uses indentation to define code blocks. Use 4 spaces per indentation level.'
        });
      } else if (error.includes('TypeError')) {
        suggestions.push({
          type: 'error',
          message: 'Type mismatch',
          solution: 'Check that you are using compatible data types. Use type() to check variable types.'
        });
      } else if (error.includes('KeyError')) {
        suggestions.push({
          type: 'error',
          message: 'Column or key not found',
          solution: 'Check column names with df.columns. Remember column names are case-sensitive.'
        });
      }
    }

    return suggestions;
  };

  const suggestions = analyzecode();

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-[#4dabf7] bg-[#1a2332] p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <h4 className="font-semibold text-[#4dabf7]">AI Assistant</h4>
            <p className="mt-1 text-xs text-[#a5b4c4]">
              Code looks good! No issues detected. Click &quot;Run&quot; to execute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#ff6b6b] bg-[#2a1616] p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🤖</div>
        <div className="flex-1">
          <h4 className="font-semibold text-[#ff6b6b]">AI Assistant - {suggestions.length} {suggestions.length === 1 ? 'Issue' : 'Issues'} Detected</h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-[#ffd700] underline hover:text-[#f4d03f]"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 ${
                    suggestion.type === 'error'
                      ? 'bg-[#3a1a1a] border border-[#ff6b6b]'
                      : suggestion.type === 'warning'
                      ? 'bg-[#3a2a1a] border border-[#fab005]'
                      : 'bg-[#1a2a3a] border border-[#4dabf7]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {suggestion.type === 'error' ? '❌' : suggestion.type === 'warning' ? '⚠️' : '💡'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#f4d03f]">
                        {suggestion.message}
                      </p>
                      {suggestion.solution && (
                        <p className="mt-1 text-xs text-[#c9a961]">
                          <strong>Solution:</strong> {suggestion.solution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
