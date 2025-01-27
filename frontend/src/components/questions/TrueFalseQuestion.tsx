import {Button} from "@/components/ui/button"

interface TrueFalseProps {
  question: string;
  onAnswer: (answer: boolean) => void;
  showAnswer: boolean;
  userAnswer: boolean | null;
  correctAnswer: boolean;
}

export function TrueFalseQuestion({
  question,
  onAnswer,
  showAnswer,
  userAnswer,
  correctAnswer,
}: TrueFalseProps) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{question}</p>
      <div className="grid grid-cols-2 gap-4">
        {[true, false].map((value) => (
          <Button
            key={value.toString()}
            variant="outline"
            className={`${
              showAnswer && value === correctAnswer
                ? "bg-green-50 border-green-500"
                : showAnswer && value === userAnswer
                ? "bg-red-50 border-red-500"
                : ""
            }`}
            onClick={() => !showAnswer && onAnswer(value)}
            disabled={showAnswer}
          >
            {value ? "True" : "False"}
          </Button>
        ))}
      </div>
    </div>
  );
}
