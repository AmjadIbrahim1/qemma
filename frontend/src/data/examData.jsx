// frontend/src/pages/teacher/data/createExamDemo.js

export const coursesDemo = [
  { id: "11111111-1111-1111-1111-111111111111", title: "كورس الفيزياء" },
  { id: "22222222-2222-2222-2222-222222222222", title: "كورس الرياضيات" },
  { id: "33333333-3333-3333-3333-333333333333", title: "كورس الكيمياء" },
];

export const QUESTION_TYPES = [
  { value: "MCQ", label: "اختيار من متعدد" },
  { value: "TF", label: "صح / غلط" },
  { value: "SHORT", label: "إجابة قصيرة" },
];

export const createQuestion = (order = 1, type = "MCQ") => {
  if (type === "TF") {
    return {
      type: "TF",
      questionText: "",
      marks: 1,
      order,
      options: [
        { optionText: "صح", isCorrect: true },
        { optionText: "غلط", isCorrect: false },
      ],
      correctAnswer: "",
    };
  }

  if (type === "SHORT") {
    return {
      type: "SHORT",
      questionText: "",
      marks: 1,
      order,
      options: [],
      correctAnswer: "",
    };
  }

  // MCQ default
  return {
    type: "MCQ",
    questionText: "",
    marks: 1,
    order,
    options: [
      { optionText: "", isCorrect: true },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
      { optionText: "", isCorrect: false },
    ],
    correctAnswer: "",
  };
};

export const createExamInitialState = () => ({
  courseId: "",
  title: "",
  description: "",
  durationMinutes: 30,
  passingMarks: 0,
  availableFrom: "",
  availableTo: "",
  
  isPublished: false,
});