export type SkillLevel = "beginner" | "intermediate" | "advanced";



export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const FIELD_QUIZZES: Record<string, QuizQuestion[]> = {
  "backend-development": [
    {
      id: "be_q1",
      prompt: "Which HTTP method is typically used to update an existing resource?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correctIndex: 2,
    },
    {
      id: "be_q2",
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
      id: "be_q3",
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
      id: "be_q4",
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
      id: "be_q5",
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
      id: "fe_q1",
      prompt: "Which HTML5 semantic element is best suited for the main header of a web page?",
      options: ["<section>", "<header>", "<div>", "<aside>"],
      correctIndex: 1,
    },
    {
      id: "fe_q2",
      prompt: "In CSS Flexbox, which property aligns items along the cross axis?",
      options: ["justify-content", "align-items", "flex-direction", "grid-gap"],
      correctIndex: 1,
    },
    {
      id: "fe_q3",
      prompt: "In React, what hook is primarily used to manage local component state?",
      options: ["useEffect", "useMemo", "useState", "useContext"],
      correctIndex: 2,
    },
    {
      id: "fe_q4",
      prompt: "What is the Virtual DOM in React?",
      options: ["A browser extension for DOM inspection", "A lightweight in-memory representation of the real DOM", "A CSS preprocessor", "A database for frontend caching"],
      correctIndex: 1,
    },
    {
      id: "fe_q5",
      prompt: "What is the purpose of `key` props when rendering lists in React?",
      options: ["To style list elements automatically", "To help React identify which items have changed, been added, or removed", "To enable CSS grid sorting", "To trigger server side re-rendering"],
      correctIndex: 1,
    },
  ],
  "full-stack-development": [
    {
      id: "fs_q1",
      prompt: "What does the MERN stack stand for?",
      options: ["MongoDB, Express, React, Node", "MySQL, Ember, Ruby, Nginx", "MariaDB, Elixir, React, Next", "Mongo, Electron, Rust, Node"],
      correctIndex: 0,
    },
    {
      id: "fs_q2",
      prompt: "How do CORS (Cross-Origin Resource Sharing) headers work?",
      options: ["They compress HTTP responses", "They allow browsers to request resources from a different origin domain safely", "They encrypt passwords in transit", "They speed up database queries"],
      correctIndex: 1,
    },
    {
      id: "fs_q3",
      prompt: "What is JSON Web Token (JWT) commonly used for?",
      options: ["Database backups", "Stateless user authentication and authorization between client and server", "CSS layout styling", "File compression"],
      correctIndex: 1,
    },
    {
      id: "fs_q4",
      prompt: "What is Server-Side Rendering (SSR)?",
      options: ["Rendering HTML on the server for each request before sending it to the client", "Compiling CSS into JavaScript", "Running database queries inside CSS", "Caching images on the client browser"],
      correctIndex: 0,
    },
    {
      id: "fs_q5",
      prompt: "What is an Object-Relational Mapper (ORM) like Prisma or TypeORM?",
      options: ["A tool to convert HTML into PDF", "A library that lets you interact with a database using object-oriented code", "A CSS framework", "A web server proxy"],
      correctIndex: 1,
    },
  ],
  "ai-machine-learning": [
    {
      id: "ai_q1",
      prompt: "In machine learning, what is the main goal of supervised learning?",
      options: ["To cluster data without any labels", "To learn a mapping from input features to target labels using labeled data", "To generate random numbers", "To speed up Python code"],
      correctIndex: 1,
    },
    {
      id: "ai_q2",
      prompt: "Which Python library is the standard for numerical array operations and tensor math?",
      options: ["NumPy", "Flask", "BeautifulSoup", "Django"],
      correctIndex: 0,
    },
    {
      id: "ai_q3",
      prompt: "What is overfitting in a Machine Learning model?",
      options: ["When a model performs well on training data but poorly on unseen test data", "When a model is too simple to learn patterns", "When training takes 0 seconds", "When a model has no hyperparameters"],
      correctIndex: 0,
    },
    {
      id: "ai_q4",
      prompt: "What does activation function (e.g. ReLU, Sigmoid) introduce to a Neural Network?",
      options: ["Non-linearity to learn complex non-linear relationships", "Linear regression equations", "Database indexing", "GPU memory acceleration"],
      correctIndex: 0,
    },
    {
      id: "ai_q5",
      prompt: "What is Transformer architecture primarily known for introducing?",
      options: ["Self-Attention mechanisms that revolutionize NLP and Large Language Models", "Convolutional layers for 2D images", "Decision tree splitting", "K-means clustering"],
      correctIndex: 0,
    },
  ],
  "data-science": [
    {
      id: "ds_q1",
      prompt: "Which Python library is widely used for data manipulation and DataFrame structures?",
      options: ["Pandas", "PyGame", "FastAPI", "Webpack"],
      correctIndex: 0,
    },
    {
      id: "ds_q2",
      prompt: "What is the median of a dataset?",
      options: ["The arithmetic average", "The middle value when the data is sorted", "The most frequent value", "The range between max and min"],
      correctIndex: 1,
    },
    {
      id: "ds_q3",
      prompt: "What is exploratory data analysis (EDA)?",
      options: ["Analyzing datasets to summarize main characteristics, spot anomalies, and visualize patterns", "Writing SQL insert statements", "Building frontend UI components", "Setting up cloud servers"],
      correctIndex: 0,
    },
    {
      id: "ds_q4",
      prompt: "What is a confusion matrix used for in classification evaluation?",
      options: ["To visualize true positives, false positives, true negatives, and false negatives", "To format JSON data", "To measure execution speed", "To encrypt user data"],
      correctIndex: 0,
    },
    {
      id: "ds_q5",
      prompt: "What is the purpose of feature scaling (e.g. Standardization or Min-Max normalization)?",
      options: ["To bring features to a common scale so distance-based algorithms train properly", "To delete missing values automatically", "To convert code into C++", "To render 3D charts"],
      correctIndex: 0,
    },
  ],
  "devops-cloud": [
    {
      id: "do_q1",
      prompt: "What is the primary function of Docker containerization?",
      options: ["To package an application and its dependencies into a lightweight, portable container", "To write frontend CSS styles", "To replace SQL databases", "To edit video files"],
      correctIndex: 0,
    },
    {
      id: "do_q2",
      prompt: "What does CI/CD stand for in modern software development?",
      options: ["Continuous Integration and Continuous Deployment/Delivery", "Code Inspection and Content Delivery", "Central Infrastructure and Cloud Data", "Compiled Interface and Custom Domain"],
      correctIndex: 0,
    },
    {
      id: "do_q3",
      prompt: "What is Kubernetes primarily used for?",
      options: ["Container orchestration, scaling, and automated management", "Compiling TypeScript code", "Generating SSL certificates manually", "Managing local Git commits"],
      correctIndex: 0,
    },
    {
      id: "do_q4",
      prompt: "What is Infrastructure as Code (IaC) with tools like Terraform?",
      options: ["Defining and provisioning cloud infrastructure using machine-readable configuration files", "Writing inline CSS in HTML", "Editing database rows manually", "Running Python scripts in browser"],
      correctIndex: 0,
    },
    {
      id: "do_q5",
      prompt: "What is the purpose of a reverse proxy like NGINX?",
      options: ["To route client requests to backend servers, handle SSL termination, and load balance traffic", "To write SQL queries", "To format React JSX code", "To host DNS domain names"],
      correctIndex: 0,
    },
  ],
};

const SCENARIOS: Record<string, [string,string[],number][]> = {
 "backend-development":[
  ["A payment webhook is delivered twice. What prevents a duplicate order?",["Increase the timeout","Use an idempotency key protected by a database uniqueness constraint","Retry both requests immediately","Cache only in process memory"],1],
  ["Two requests reserve the final seat concurrently. Where should correctness be enforced?",["Only in the browser","In a daily cleanup job","In the database transaction and constraints","With a client-side loading spinner"],2],
  ["A dependency slows down and requests accumulate. What bounds the damage?",["Unlimited retries","Larger unbounded queues","Disable all timeouts","Deadlines, bounded concurrency and backpressure"],3]],
 "frontend-development":[
  ["An old search response arrives after a newer response. What should the interface do?",["Always show the last response to arrive","Accept results only for the current request or query","Reload the page","Use a longer fixed delay"],1],
  ["A modal closes after keyboard use. Where should focus usually return?",["The document body","The address bar","The control that opened the modal","Nowhere"],2],
  ["An optimistic update fails. What is a reliable response?",["Leave the optimistic value silently","Undo or reconcile the change and offer a clear retry","Hide all errors","Mark the operation complete anyway"],1]],
 "full-stack-development":[
  ["A user changes a record ID in a request. What protects another user's record?",["A hidden button","A UUID alone","An ownership check on the server or database for that operation","Client-side route guards alone"],2],
  ["A save commits but its response is lost. How should a retry behave?",["Always create another record","Use a stable operation identifier to return or complete the same save","Delete all previous saves","Assume the save failed forever"],1],
  ["An API response contains private data. Which caching policy is safe?",["One global cache key for every user","Cache it indefinitely on a CDN","Ignore authentication in the key","Avoid shared caching or scope it to the authorized user"],3]],
 "ai-machine-learning":[
  ["Which preprocessing procedure avoids holdout leakage?",["Fit transformations on the whole dataset","Fit transformations on training data and apply them to the holdout","Tune repeatedly on the holdout","Remove the holdout after training"],1],
  ["A model scores well overall but poorly for one group. What is the next step?",["Report only the aggregate","Delete that group","Investigate subgroup errors and uncertainty before deployment","Assume random noise without checking"],2],
  ["A faster quantized model is proposed. What evidence should decide adoption?",["File size alone","Its name","Training accuracy alone","Task quality and latency/memory measurements on representative inputs"],3]],
 "data-science":[
  ["A join unexpectedly doubles revenue totals. What should you inspect first?",["Chart colors","Duplicate keys and join cardinality","The font size","The model learning rate"],1],
  ["Customers who use a feature retain longer. Does this prove the feature causes retention?",["Yes, always","Yes, if the sample is large","No; confounding and selection can explain the association","Only the chart type matters"],2],
  ["Why decide an experiment's stopping rule in advance?",["To prevent all variance","To make data collection unnecessary","To guarantee significance","To control errors caused by repeatedly checking and stopping opportunistically"],3]],
 "devops-cloud":[
  ["A rollout increases errors. What makes recovery dependable?",["An untested backup somewhere","A tested rollback or roll-forward plan with compatible data changes","Restart every service blindly","Disable monitoring"],1],
  ["What demonstrates a backup can support recovery?",["Its filename","A successful upload alone","A restore drill that meets measured recovery objectives","A large file size"],2],
  ["What best limits the impact of a compromised workload?",["Shared administrator credentials","Public access to all services","A longer password in source control","Least privilege, isolation and scoped credentials"],3]],
};
for (const [field,questions] of Object.entries(SCENARIOS)) {
 FIELD_QUIZZES[field].push(...questions.map(([prompt,options,correctIndex],i)=>({id:field+"_scenario_"+i,prompt,options,correctIndex})));
}

export const BACKEND_DEV_QUIZ = getQuizForField("backend-development");

export function getQuizForField(slug: string): QuizQuestion[] {
  return (FIELD_QUIZZES[slug] ?? []).map((q,index) => {
    const offset=(index * 3 + 1) % q.options.length;
    return {...q, options:[...q.options.slice(offset),...q.options.slice(0,offset)], correctIndex:(q.correctIndex-offset+q.options.length)%q.options.length};
  });
}

export function blendSkillLevel(
  selfReported: SkillLevel,
  quizAnswers: number[],
  fieldSlug: string = "backend-development"
): { finalLevel: SkillLevel; quizScore: number; quizImpliedLevel: SkillLevel } {
  const quiz = getQuizForField(fieldSlug);
  const quizScore = quiz.reduce(
    (score, question, i) => score + (quizAnswers[i] === question.correctIndex ? 1 : 0),
    0
  );

  const fraction = quiz.length ? quizScore / quiz.length : 0;
  const scenariosCorrect=quiz.filter((q,i)=>q.id.includes("_scenario_") && quizAnswers[i]===q.correctIndex).length;
  const quizImpliedLevel: SkillLevel = fraction < 0.4 ? "beginner" : fraction >= 0.75 && scenariosCorrect >= 2 ? "advanced" : "intermediate";

  const finalLevel = quiz.length && quizAnswers.length === quiz.length ? quizImpliedLevel : selfReported;

  return { finalLevel, quizScore, quizImpliedLevel };
}
