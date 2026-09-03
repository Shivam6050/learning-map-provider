export type SkillLevel = "beginner" | "intermediate" | "advanced";

const LEVEL_INDEX: Record<SkillLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const INDEX_LEVEL: SkillLevel[] = ["beginner", "intermediate", "advanced"];

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const FIELD_QUIZZES: Record<string, QuizQuestion[]> = {
  "backend-development": [
    {
      id: "q1",
      prompt: "Which HTTP method is typically used to update an existing resource?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctIndex: 2,
    },
    {
      id: "q2",
      prompt: "What does REST stand for in the context of web APIs?",
      options: [
        "Representational State Transfer",
        "Remote Execution Service Transfer",
        "Reliable Endpoint State Transaction",
        "Rapid Endpoint Synchronization Tool",
      ],
      correctIndex: 0,
    },
    {
      id: "q3",
      prompt: "Why should secrets like API keys be stored in environment variables rather than committed to code?",
      options: [
        "It makes the code run faster",
        "It keeps secrets out of version control and lets them differ per environment",
        "It's required by JavaScript syntax",
        "It automatically encrypts the secret",
      ],
      correctIndex: 1,
    },
    {
      id: "q4",
      prompt: "What's the main purpose of a database index?",
      options: [
        "To make writes faster at the cost of read speed",
        "To enforce that a column is unique",
        "To speed up lookups on a column at some cost to write speed",
        "To automatically back up the table",
      ],
      correctIndex: 2,
    },
    {
      id: "q5",
      prompt: "In Node.js, what does `await` do when placed before a Promise?",
      options: [
        "Runs the Promise in a separate thread",
        "Pauses execution of the current async function until the Promise settles",
        "Cancels the Promise if it takes too long",
        "Converts the Promise into a callback",
      ],
      correctIndex: 1,
    },
  ],
  "frontend-development": [
    {
      id: "q1",
      prompt: "Which HTML5 semantic element is best suited for the main header of a web page?",
      options: ["<section>", "<header>", "<div>", "<aside>"],
      correctIndex: 1,
    },
    {
      id: "q2",
      prompt: "In CSS Flexbox, which property aligns items along the cross axis?",
      options: ["justify-content", "align-items", "flex-direction", "grid-gap"],
      correctIndex: 1,
    },
    {
      id: "q3",
      prompt: "In React, what hook is primarily used to manage local component state?",
      options: ["useEffect", "useMemo", "useState", "useContext"],
      correctIndex: 2,
    },
    {
      id: "q4",
      prompt: "What is the Virtual DOM in React?",
      options: ["A browser extension for DOM inspection", "A lightweight in-memory representation of the real DOM", "A CSS preprocessor", "A database for frontend caching"],
      correctIndex: 1,
    },
    {
      id: "q5",
      prompt: "What is the purpose of `key` props when rendering lists in React?",
      options: ["To style list elements automatically", "To help React identify which items have changed, been added, or removed", "To enable CSS grid sorting", "To trigger server side re-rendering"],
      correctIndex: 1,
    },
  ],
  "full-stack-development": [
    {
      id: "q1",
      prompt: "What does the MERN stack stand for?",
      options: ["MongoDB, Express, React, Node", "MySQL, Ember, Ruby, Nginx", "MariaDB, Elixir, React, Next", "Mongo, Electron, Rust, Node"],
      correctIndex: 0,
    },
    {
      id: "q2",
      prompt: "How do CORS (Cross-Origin Resource Sharing) headers work?",
      options: ["They compress HTTP responses", "They allow browsers to request resources from a different origin domain safely", "They encrypt passwords in transit", "They speed up database queries"],
      correctIndex: 1,
    },
    {
      id: "q3",
      prompt: "What is JSON Web Token (JWT) commonly used for?",
      options: ["Database backups", "Stateless user authentication and authorization between client and server", "CSS layout styling", "File compression"],
      correctIndex: 1,
    },
    {
      id: "q4",
      prompt: "What is Server-Side Rendering (SSR)?",
      options: ["Rendering HTML on the server for each request before sending it to the client", "Compiling CSS into JavaScript", "Running database queries inside CSS", "Caching images on the client browser"],
      correctIndex: 0,
    },
    {
      id: "q5",
      prompt: "What is an Object-Relational Mapper (ORM) like Prisma or TypeORM?",
      options: ["A tool to convert HTML into PDF", "A library that lets you interact with a database using object-oriented code", "A CSS framework", "A web server proxy"],
      correctIndex: 1,
    },
  ],
  "ai-machine-learning": [
    {
      id: "q1",
      prompt: "In machine learning, what is the main goal of supervised learning?",
      options: ["To cluster data without any labels", "To learn a mapping from input features to target labels using labeled data", "To generate random numbers", "To speed up Python code"],
      correctIndex: 1,
    },
    {
      id: "q2",
      prompt: "Which Python library is the standard for numerical array operations and tensor math?",
      options: ["NumPy", "Flask", "BeautifulSoup", "Django"],
      correctIndex: 0,
    },
    {
      id: "q3",
      prompt: "What is overfitting in a Machine Learning model?",
      options: ["When a model performs well on training data but poorly on unseen test data", "When a model is too simple to learn patterns", "When training takes 0 seconds", "When a model has no hyperparameters"],
      correctIndex: 0,
    },
    {
      id: "q4",
      prompt: "What does activation function (e.g. ReLU, Sigmoid) introduce to a Neural Network?",
      options: ["Non-linearity to learn complex non-linear relationships", "Linear regression equations", "Database indexing", "GPU memory acceleration"],
      correctIndex: 0,
    },
    {
      id: "q5",
      prompt: "What is Transformer architecture primarily known for introducing?",
      options: ["Self-Attention mechanisms that revolutionize NLP and Large Language Models", "Convolutional layers for 2D images", "Decision tree splitting", "K-means clustering"],
      correctIndex: 0,
    },
  ],
  "data-science": [
    {
      id: "q1",
      prompt: "Which Python library is widely used for data manipulation and DataFrame structures?",
      options: ["Pandas", "PyGame", "FastAPI", "Webpack"],
      correctIndex: 0,
    },
    {
      id: "q2",
      prompt: "What is the median of a dataset?",
      options: ["The arithmetic average", "The middle value when the data is sorted", "The most frequent value", "The range between max and min"],
      correctIndex: 1,
    },
    {
      id: "q3",
      prompt: "What is exploratory data analysis (EDA)?",
      options: ["Analyzing datasets to summarize main characteristics, spot anomalies, and visualize patterns", "Writing SQL insert statements", "Building frontend UI components", "Setting up cloud servers"],
      correctIndex: 0,
    },
    {
      id: "q4",
      prompt: "What is a confusion matrix used for in classification evaluation?",
      options: ["To visualize true positives, false positives, true negatives, and false negatives", "To format JSON data", "To measure execution speed", "To encrypt user data"],
      correctIndex: 0,
    },
    {
      id: "q5",
      prompt: "What is the purpose of feature scaling (e.g. Standardization or Min-Max normalization)?",
      options: ["To bring features to a common scale so distance-based algorithms train properly", "To delete missing values automatically", "To convert code into C++", "To render 3D charts"],
      correctIndex: 0,
    },
  ],
  "devops-cloud": [
    {
      id: "q1",
      prompt: "What is the primary function of Docker containerization?",
      options: ["To package an application and its dependencies into a lightweight, portable container", "To write frontend CSS styles", "To replace SQL databases", "To edit video files"],
      correctIndex: 0,
    },
    {
      id: "q2",
      prompt: "What does CI/CD stand for in modern software development?",
      options: ["Continuous Integration and Continuous Deployment/Delivery", "Code Inspection and Content Delivery", "Central Infrastructure and Cloud Data", "Compiled Interface and Custom Domain"],
      correctIndex: 0,
    },
    {
      id: "q3",
      prompt: "What is Kubernetes primarily used for?",
      options: ["Container orchestration, scaling, and automated management", "Compiling TypeScript code", "Generating SSL certificates manually", "Managing local Git commits"],
      correctIndex: 0,
    },
    {
      id: "q4",
      prompt: "What is Infrastructure as Code (IaC) with tools like Terraform?",
      options: ["Defining and provisioning cloud infrastructure using machine-readable configuration files", "Writing inline CSS in HTML", "Editing database rows manually", "Running Python scripts in browser"],
      correctIndex: 0,
    },
    {
      id: "q5",
      prompt: "What is the purpose of a reverse proxy like NGINX?",
      options: ["To route client requests to backend servers, handle SSL termination, and load balance traffic", "To write SQL queries", "To format React JSX code", "To host DNS domain names"],
      correctIndex: 0,
    },
  ],
};

export const BACKEND_DEV_QUIZ = FIELD_QUIZZES["backend-development"];

export function getQuizForField(slug: string): QuizQuestion[] {
  return FIELD_QUIZZES[slug] ?? FIELD_QUIZZES["backend-development"];
}

export function blendSkillLevel(
  selfReported: SkillLevel,
  quizAnswers: number[],
  fieldSlug: string = "backend-development"
): { finalLevel: SkillLevel; quizScore: number; quizImpliedLevel: SkillLevel } {
  const quiz = getQuizForField(fieldSlug);
  const quizScore = quizAnswers.reduce(
    (score, answer, i) => score + (answer === quiz[i]?.correctIndex ? 1 : 0),
    0
  );

  const quizImpliedLevel: SkillLevel = quizScore <= 1 ? "beginner" : quizScore <= 3 ? "intermediate" : "advanced";

  const blendedIndex = Math.round((LEVEL_INDEX[selfReported] + LEVEL_INDEX[quizImpliedLevel]) / 2);
  const finalLevel = INDEX_LEVEL[blendedIndex];

  return { finalLevel, quizScore, quizImpliedLevel };
}
