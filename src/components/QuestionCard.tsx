import { Check, X } from "lucide-react";
import type { Question } from "../content/quiz";
import type { Answer } from "../lib/storage";
export default function QuestionCard({
  question,
  answer,
  onAnswer,
  number,
}: {
  question: Question;
  answer?: Answer;
  onAnswer: (choice: number) => void;
  number?: number;
}) {
  return (
    <section className="question-card">
      <div className="question-title">
        {number !== undefined && (
          <span className="question-number">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <h3>{question.prompt}</h3>
      </div>
      <div className="answer-options">
        {question.options.map((o, i) => (
          <button
            key={o}
            className={`answer-option ${answer ? (i === question.correct ? "answer-correct" : i === answer.choice ? "answer-wrong" : "") : ""}`}
            disabled={!!answer}
            onClick={() => onAnswer(i)}
          >
            <span className="option-marker">
              {answer && i === question.correct ? (
                <Check size={16} />
              ) : answer && i === answer.choice ? (
                <X size={16} />
              ) : (
                String.fromCharCode(65 + i)
              )}
            </span>
            {o}
          </button>
        ))}
      </div>
      {answer && (
        <div
          className={`answer-explanation ${answer.correct ? "" : "incorrect"}`}
          role="status"
        >
          <b>{answer.correct ? "Верно." : "Разберём решение."}</b>{" "}
          {question.explanation}
        </div>
      )}
    </section>
  );
}
