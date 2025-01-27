// src/components/questions/FillInBlankQuestion.tsx
import { useState } from "react";

interface FillInBlankProps {
  question: string;
  onAnswer: (answer: string) => void;
  showAnswer: boolean;
  userAnswer: string | null;
  correctAnswer: string;
}

export function FillInBlankQuestion({
  question,
  onAnswer,
  showAnswer,
  userAnswer,
  correctAnswer,
}: FillInBlankProps) {
  const [input, setInput] = useState(userAnswer || "");

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question}</p>
      <div className="space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !showAnswer) {
              onAnswer(input);
            }
          }}
          className="w-full p-2 border rounded"
          placeholder="Type your answer..."
          disabled={showAnswer}
        />
        {showAnswer && (
          <div
            className={`mt-2 p-2 rounded ${
              String(userAnswer).toLowerCase().trim() ===
              correctAnswer.toLowerCase().trim()
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            Correct answer: {correctAnswer}
          </div>
        )}
      </div>
    </div>
  );
}