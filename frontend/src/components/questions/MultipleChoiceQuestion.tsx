import { Button } from "@/components/ui/button";

interface MultipleChoiceProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  showAnswer: boolean;
  userAnswer: string | null;
  correctAnswer: string;
}

export function MultipleChoiceQuestion({
  question,
  options,
  onAnswer,
  showAnswer,
  userAnswer,
  correctAnswer,
}: MultipleChoiceProps) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question}</p>
      <div className="space-y-2">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className={`w-full justify-start ${
              showAnswer && option === correctAnswer
                ? "bg-green-50 border-green-500"
                : showAnswer && option === userAnswer
                ? "bg-red-50 border-red-500"
                : ""
            }`}
            onClick={() => !showAnswer && onAnswer(option)}
            disabled={showAnswer}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
