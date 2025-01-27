// components/questions/MatchingQuestion.tsx
import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface MatchingQuestionProps {
  question: string;
  pairs: Array<{ left: string; right: string }>;
  onAnswer: (answer: any) => void;
  showAnswer: boolean;
  userAnswer: any;
  correctAnswer: any;
}

const DraggableItem = ({ id, content }: { id: number; content: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="p-2 sm:p-3 bg-white border rounded-md shadow-sm cursor-move hover:shadow active:shadow-lg 
        transition-all text-sm sm:text-base touch-manipulation"
    >
      {content}
    </div>
  );
};

const DroppableZone = ({
  id,
  content,
  matched,
  correctMatch,
}: {
  id: number;
  content: string;
  matched?: string;
  correctMatch: string;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const getMatchStyle = () => {
    if (!matched) return "bg-gray-50";
    if (matched === correctMatch)
      return "bg-green-50 border-2 border-green-500";
    return "bg-red-50 border-2 border-red-500";
  };

  return (
    <div
      ref={setNodeRef}
      className={`p-2 sm:p-3 rounded-md transition-colors min-h-[60px] ${
        isOver ? "bg-blue-50" : getMatchStyle()
      }`}
    >
      <div className="font-medium text-sm sm:text-base">{content}</div>
      {matched && (
        <div
          className={`mt-1 text-xs sm:text-sm ${
            matched === correctMatch ? "text-green-600" : "text-red-600"
          }`}
        >
          ↔ {matched}
        </div>
      )}
    </div>
  );
};

export const MatchingQuestion = ({
  question,
  pairs,
  onAnswer,
  showAnswer,
  userAnswer,
}: MatchingQuestionProps) => {
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  const [matches, setMatches] = useState<{ [key: string]: string }>({});
  const [rightItems] = useState(() =>
    shuffleArray(pairs.map((pair) => pair.right))
  );

  // Configure sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const isMatchCorrect = (left: string, right: string) => {
    return pairs.some((pair) => pair.left === left && pair.right === right);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) {
      const draggedItem = rightItems[Number(active.id)];
      const dropTarget = pairs[Number(over.id)].left;

      setMatches((prev) => ({
        ...prev,
        [dropTarget]: draggedItem,
      }));

      const updatedMatches = { ...matches, [dropTarget]: draggedItem };
      if (Object.keys(updatedMatches).length === pairs.length) {
        const allMatches = Object.entries(updatedMatches).map(
          ([left, right]) => ({
            left,
            right,
            isCorrect: isMatchCorrect(left, right),
          })
        );

        onAnswer(allMatches);
      }
    }
  }

  const correctMatches = Object.entries(matches).filter(([left, right]) =>
    isMatchCorrect(left, right)
  ).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-sm sm:text-lg mb-3 sm:mb-6">{question}</p>

      <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
        Correct matches: {correctMatches} / {pairs.length}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div className="space-y-2 sm:space-y-4">
            {pairs.map((pair, index) => (
              <DroppableZone
                key={index}
                id={index}
                content={pair.left}
                matched={matches[pair.left]}
                correctMatch={pair.right}
              />
            ))}
          </div>

          <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-0">
            {rightItems.map((item, index) => (
              <DraggableItem key={index} id={index} content={item} />
            ))}
          </div>
        </div>
      </DndContext>

      {showAnswer && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-md text-sm sm:text-base">
          <div className="font-medium mb-2">Correct Matches:</div>
          {pairs.map((pair, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-4 py-1">
              <span>{pair.left}</span>
              <span className="text-gray-400">↔</span>
              <span className="text-green-600">{pair.right}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
