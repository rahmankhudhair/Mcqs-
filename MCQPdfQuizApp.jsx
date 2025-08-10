import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = \`//cdnjs.cloudflare.com/ajax/libs/pdf.js/\${pdfjsLib.version}/pdf.worker.min.js\`;

function parseMCQs(text) {
  // A simple parser example - may need customization depending on your PDF
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  let currentQuestion = null;

  lines.forEach(line => {
    // Simple heuristic: questions start with a number and a dot
    if (/^\d+\./.test(line)) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = { question: line, options: [], answer: null, explanation: null };
    } else if (/^[A-D]\./.test(line)) {
      if (currentQuestion) currentQuestion.options.push(line);
    } else if (/^Answer:\s*(.*)/i.test(line)) {
      if (currentQuestion) currentQuestion.answer = line.replace(/^Answer:\s*/i, '');
    } else if (/^Explanation:\s*(.*)/i.test(line)) {
      if (currentQuestion) currentQuestion.explanation = line.replace(/^Explanation:\s*/i, '');
    }
  });
  if (currentQuestion) questions.push(currentQuestion);
  return questions;
}

export default function MCQPdfQuizApp() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join("\n") + "\n";
    }
    const parsed = parseMCQs(fullText);
    setQuestions(parsed);
    setCurrent(0);
    setSelected(null);
    setShowAnswer(false);
    setScore(0);
  }

  function selectOption(option) {
    if (showAnswer) return;
    setSelected(option);
    setShowAnswer(true);
    if (option.startsWith(questions[current].answer)) {
      setScore(score + 1);
    }
  }

  function nextQuestion() {
    setCurrent(current + 1);
    setSelected(null);
    setShowAnswer(false);
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">MCQ PDF Quiz App</h1>
        <input type="file" accept=".pdf" onChange={handleFile} />
        <p className="mt-4 text-gray-600">Upload a PDF containing MCQs to start.</p>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">MCQ PDF Quiz App</h1>
      <div className="mb-4">
        <strong>Question {current + 1} / {questions.length}</strong>
      </div>
      <div className="mb-4 text-lg">{q.question}</div>
      <div>
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => selectOption(opt)}
            disabled={showAnswer}
            className={`block w-full text-left px-4 py-2 mb-2 border rounded ${
              selected === opt
                ? (opt.startsWith(q.answer) ? 'bg-green-300' : 'bg-red-300')
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {showAnswer && (
        <div className="mt-4 p-4 border-l-4 border-blue-500 bg-blue-100">
          <div><strong>Correct Answer:</strong> {q.answer}</div>
          {q.explanation && <div className="mt-2"><strong>Explanation:</strong> {q.explanation}</div>}
          <button
            onClick={nextQuestion}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next Question
          </button>
          <div className="mt-2">
            Score: {score} / {questions.length}
          </div>
        </div>
      )}
    </div>
  );
}