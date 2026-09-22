import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { scoreAlignment, scorePathFit } from "../lib/career/alignment";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@aaroh.local";
  const passwordHash = await bcrypt.hash("AarohDemo123!", 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const alignment = scoreAlignment({
    skills: [
      { depth: "production", relevance: "core" },
      { depth: "practiced", relevance: "core" },
      { depth: "listed", relevance: "supporting" },
    ],
    yearsOfExperience: "2–3 years",
    experienceRelevance: "medium",
    goalSpecificity: "specific",
    evidenceStrength: "medium",
    gaps: [{ severity: "high" }, { severity: "medium" }, { severity: "medium" }],
  });

  const paths = [
    {
      roleName: "AI Product Manager",
      summary: "A path that uses your product sense and engineering background more than new mathematical depth.",
      whyIdentified: "You already ship product features and can translate technical constraints. The larger gap is stakeholder and discovery evidence, not a new programming stack.",
      transferableSkills: ["Product thinking", "Frontend delivery", "API collaboration"],
      missingSkills: ["Discovery", "Prioritization evidence", "Metrics ownership"],
      difficulty: "moderate",
      nextStep: "Write a short product brief for one AI feature and review it with a PM.",
      transitionSteps: ["Shadow a product decision", "Write one brief", "Ship a scoped AI feature"],
      experiments: ["Rewrite one feature spec with success metrics"],
      skillOverlap: 4,
      interestOverlap: 5,
      experienceTransfer: 4,
      gapBurden: 2,
    },
    {
      roleName: "Data Scientist",
      summary: "Possible if you want the statistical side of the work more than production systems.",
      whyIdentified: "Your engineering base helps with implementation, and the profile has less evidence of statistics and experiment design.",
      transferableSkills: ["Python interest", "SQL", "Problem solving"],
      missingSkills: ["Statistics", "Experiment design", "Modeling depth"],
      difficulty: "high",
      nextStep: "Complete a statistics refresh and one evaluated model, before calling this the main path.",
      transitionSteps: ["Statistics refresh", "One evaluated model", "Compare it with the AI engineering path"],
      experiments: ["Analyze a public dataset and write the evaluation notes"],
      skillOverlap: 3,
      interestOverlap: 3,
      experienceTransfer: 3,
      gapBurden: 4,
    },
    {
      roleName: "Machine Learning Engineer",
      summary: "Adjacent to your goal, with a heavier requirement for model and data pipeline evidence.",
      whyIdentified: "Software engineering transfers, but the available evidence does not yet show production model work.",
      transferableSkills: ["APIs", "TypeScript", "Shipping software"],
      missingSkills: ["Model evaluation", "Data pipelines", "Model serving"],
      difficulty: "high",
      nextStep: "Build one small prediction service only after the foundation phase.",
      transitionSteps: ["Foundations", "One trained model", "Serve it behind an API"],
      experiments: ["A notebook that reports precision, recall, and failure cases"],
      skillOverlap: 3,
      interestOverlap: 4,
      experienceTransfer: 3,
      gapBurden: 4,
    },
    {
      roleName: "Product Manager",
      summary: "A broader product path if you decide the engineering depth of AI is not the point.",
      whyIdentified: "You describe product work as interesting. This is a possibility, not a recommendation to leave engineering.",
      transferableSkills: ["User-facing work", "Communication", "Frontend context"],
      missingSkills: ["Roadmap ownership", "Customer discovery", "Success metrics"],
      difficulty: "moderate",
      nextStep: "Try one discovery interview before treating this as the destination.",
      transitionSteps: ["One discovery interview", "One metric", "One written tradeoff"],
      experiments: ["Interview two users of a tool you already use"],
      skillOverlap: 3,
      interestOverlap: 4,
      experienceTransfer: 3,
      gapBurden: 3,
    },
  ].map((path) => {
    const fit = scorePathFit(path);
    return { ...path, fitScore: fit.score, fitLabel: fit.label };
  });

  const user = await prisma.user.create({
    data: {
      name: "Aaroh Demo",
      email,
      passwordHash,
      profile: {
        create: {
          currentRole: "Software Engineer",
          yearsOfExperience: "2–3 years",
          industry: "Software",
          region: "India",
          goalText: "I want to become an AI engineer at a product company.",
          timeframe: "6–12 months",
          targetEnvironment: "Product company",
          interests: ["AI", "Product development", "System design"],
          enjoys: "Building products and understanding how systems work.",
          dislikes: "Pixel-perfect visual polish as the main job.",
          currentLearning: "Python for data work",
          careerConcern: "Don't know what to learn",
          onboardingStep: "complete",
          onboardingComplete: true,
          resumeSkipped: true,
          skills: {
            create: ["React", "TypeScript", "Node.js", "SQL"].map((name) => ({
              name,
              category: "self_reported",
            })),
          },
          education: {
            create: { degree: "Bachelor's", field: "Computer Science", institution: "Not specified" },
          },
        },
      },
    },
  });

  const analysis = await prisma.analysis.create({
    data: {
      userId: user.id,
      status: "COMPLETED",
      analysisVersion: 1,
      promptVersion: 1,
      model: "seed",
      startedAt: new Date(),
      completedAt: new Date(),
      stages: {
        create: [
          ["resume_extraction", "Extracting resume details", "SKIPPED"],
          ["profile_normalization", "Understanding your background", "COMPLETED"],
          ["skill_analysis", "Analyzing skills and experience", "COMPLETED"],
          ["goal_analysis", "Mapping career goals", "COMPLETED"],
          ["gap_analysis", "Comparing role expectations", "COMPLETED"],
          ["alternatives", "Exploring career paths", "COMPLETED"],
          ["roadmap", "Building your roadmap", "COMPLETED"],
          ["report", "Generating insights", "COMPLETED"],
        ].map(([key, label, status], index) => ({
          key,
          label,
          status: status as "COMPLETED" | "SKIPPED",
          sortOrder: index + 1,
          completedAt: new Date(),
        })),
      },
    },
  });

  const snapshot = {
    currentRole: "Software Engineer",
    experience: "2–3 years",
    location: "India",
    primaryProfile:
      "Software engineer with strong frontend delivery experience and an interest in AI and product development. Python is something you are learning, not something the profile shows in production.",
    careerGoal: "AI Engineer",
  };
  const strengths = [
    { title: "Problem solving", evidence: "You describe the work you enjoy as technical problem solving, and your role is hands-on software engineering.", basis: "inference" },
    { title: "Frontend development", evidence: "React and TypeScript are self-reported as primary skills, alongside a software engineering role.", basis: "fact" },
    { title: "Product thinking", evidence: "You named product development as an interest and described enjoying how systems fit a product.", basis: "fact" },
    { title: "Quick learning", evidence: "You are already studying Python while working. Depth is not established from that alone.", basis: "inference" },
  ];
  const gaps = {
    gaps: [
      { skill: "Machine learning", whyItMatters: "An AI engineer role expects you to choose, evaluate, and explain models, not only call an API.", currentEvidence: "No project or work evidence of model development.", requiredCapability: "Supervised learning, evaluation, and a small end-to-end model.", severity: "high", priority: 1, recommendedAction: "Study core ML and evaluate one model with a written error analysis.", basis: "uncertain" },
      { skill: "System design", whyItMatters: "Product-company AI roles ask how a feature survives real traffic and failure.", currentEvidence: "Limited evidence beyond application development.", requiredCapability: "Explain tradeoffs for a multi-service design.", severity: "medium", priority: 2, recommendedAction: "Design two small production-style architectures and write the tradeoffs.", basis: "inference" },
      { skill: "Cloud and deployment", whyItMatters: "The goal is a product company, where shipping includes running the system.", currentEvidence: "Deployment evidence was not provided.", requiredCapability: "Deploy one service and describe how you would watch it.", severity: "medium", priority: 3, recommendedAction: "Deploy one small API and add basic health and logging.", basis: "uncertain" },
    ],
    alreadyHave: ["Software engineering practice", "React and TypeScript", "API development", "SQL familiarity"],
    needToStrengthen: ["Python for data work", "Statistics", "Evaluation"],
    limitedEvidence: ["Production ML systems", "Model serving", "MLOps"],
  };
  const skills = [
    { name: "React", category: "frontend", depth: "production", relevance: "supporting", source: "self_report", evidence: "Named as a primary skill in a software engineering role." },
    { name: "TypeScript", category: "frontend", depth: "practiced", relevance: "core", source: "self_report", evidence: "Named alongside React. Depth beyond professional use is not further documented." },
    { name: "Python", category: "ml", depth: "listed", relevance: "core", source: "self_report", evidence: "You said you are learning Python. That does not establish production depth." },
  ];
  const goal = {
    interpretedGoal: "Move from software engineering into an AI engineer role at a product company.",
    specificity: "specific",
    targetRole: "AI Engineer",
    summary: "The destination is an applied AI role that still values shipping software, with new evidence needed in modeling and evaluation.",
    technicalFoundations: ["Python", "Statistics", "Machine learning basics"],
    appliedSkills: ["Model evaluation", "LLM application design", "Retrieval"],
    productionSkills: ["API deployment", "Monitoring", "Simple MLOps"],
    professionalCapabilities: ["Explaining tradeoffs", "Writing technical decisions"],
    goalClarityNote: "The role and company type are specific. The exact AI specialty is still open.",
  };

  const report = await prisma.careerReport.create({
    data: {
      userId: user.id,
      analysisId: analysis.id,
      snapshot,
      strengths,
      gaps,
      skills,
      targetCareer: goal,
      opportunities: paths,
      recommendations: [
        { title: "Close the evaluation gap first", detail: "A deployed demo without an evaluation story will not read as AI engineering evidence." },
        { title: "Keep the software advantage", detail: "Do not drop frontend and API work. It is the transferable base for the product-company goal." },
      ],
      resumeInsights: [
        { title: "No resume was uploaded", detail: "This profile is based on what you typed. A resume would let Aaroh separate stated skills from demonstrated work.", basis: "uncertain" },
      ],
      alignmentScore: alignment.score,
      alignmentBreakdown: alignment.breakdown,
      alignmentExplanation: `The estimate is ${alignment.score} because software delivery is real evidence, while machine learning and production AI evidence are still thin. It is not a hiring prediction.`,
      paths: {
        create: paths.map((path) => ({
          userId: user.id,
          roleName: path.roleName,
          summary: path.summary,
          whyIdentified: path.whyIdentified,
          transferableSkills: path.transferableSkills,
          missingSkills: path.missingSkills,
          difficulty: path.difficulty,
          nextStep: path.nextStep,
          transitionPath: path.transitionSteps,
          experiments: path.experiments,
          fitScore: path.fitScore,
          fitLabel: path.fitLabel,
        })),
      },
    },
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId: user.id,
      reportId: report.id,
      targetRole: "AI Engineer",
      version: 1,
      isCurrent: true,
      hoursPerWeek: 8,
      phases: {
        create: [
          {
            sortOrder: 1,
            title: "Foundations",
            description: "Build the math and Python base the AI engineer goal assumes, without pretending you already have it.",
            duration: "3–4 weeks",
            objective: "Be able to explain a model evaluation in your own words.",
            skills: ["Python", "Statistics", "Linear algebra"],
            topics: ["Python for data work", "Probability and statistics", "Linear algebra", "Intro to machine learning"],
            resources: [
              { title: "Python for Everybody", detail: "Use the sections that get you comfortable reading and writing data scripts." },
              { title: "Khan Academy statistics", detail: "Focus on distributions, sampling, and what a metric actually says." },
            ],
            evidence: "A short note that evaluates one simple model and lists where it fails.",
          },
          {
            sortOrder: 2,
            title: "Applied AI",
            description: "Connect the foundation to an application you could explain to another engineer.",
            duration: "4–6 weeks",
            objective: "Ship a small retrieval-backed assistant with an evaluation set.",
            skills: ["Embeddings", "RAG", "Evaluation"],
            topics: ["Embeddings", "Retrieval", "Prompt and context limits", "Evaluation sets"],
            resources: [{ title: "Hands-on notes", detail: "Keep a log of what the system got wrong, not only a demo video." }],
            evidence: "A deployed or locally runnable app plus ten example questions and the results.",
          },
          {
            sortOrder: 3,
            title: "Production and deployment",
            description: "Show that the system can run outside a notebook.",
            duration: "4–8 weeks",
            objective: "Deploy one service and describe how you would notice if it broke.",
            skills: ["APIs", "Deployment", "Logging"],
            topics: ["Container basics", "A hosted deploy", "Health checks", "Simple logging"],
            resources: [{ title: "Your existing API experience", detail: "Reuse Node or Python, whichever you can ship faster." }],
            evidence: "A URL or runbook and a paragraph on failure modes.",
          },
          {
            sortOrder: 4,
            title: "Portfolio and job readiness",
            description: "Turn the work into evidence a hiring manager can read.",
            duration: "4–6 weeks",
            objective: "Have two pieces of work that map to the AI engineer goal.",
            skills: ["Technical writing", "Portfolio"],
            topics: ["Architecture write-up", "Resume bullets grounded in the projects", "A practice explanation"],
            resources: [{ title: "Your own write-ups", detail: "One page per project: problem, approach, result, limit." }],
            evidence: "Two project pages and resume bullets that only claim what those projects show.",
          },
        ],
      },
    },
    include: { phases: true },
  });

  await prisma.project.createMany({
    data: [
      {
        userId: user.id,
        roadmapId: roadmap.id,
        title: "Production RAG knowledge assistant",
        description: "A small assistant over documents you actually know, with a fixed evaluation set.",
        whyItMatters: "It shows retrieval, integration, and the judgment to measure whether the answers are any good.",
        skills: ["Python", "RAG", "Embeddings", "APIs"],
        requirements: ["A document set", "A retrieval step", "An evaluation sheet", "A short architecture note"],
        architecture: "A simple API in front of an embedding index. No extra services until the evaluation exists.",
        expectedOutcome: "You can explain what the system retrieves, when it fails, and what you would change.",
        resumeEvidence: "Built a retrieval assistant and evaluated it against a written question set.",
      },
      {
        userId: user.id,
        roadmapId: roadmap.id,
        title: "Deployed prediction service",
        description: "Train a modest model and serve one prediction endpoint.",
        whyItMatters: "It connects model work to the software skills you already have.",
        skills: ["Model training", "APIs", "Deployment"],
        requirements: ["A small dataset", "Train and evaluate", "One API", "A deploy"],
        architecture: "One service. Training can stay offline. The API only serves the saved model.",
        expectedOutcome: "A running endpoint and a note on the metric you trust and the one you do not.",
        resumeEvidence: "Served a model behind an API and documented its evaluation.",
      },
    ],
  });

  await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "What should I focus on next?",
      messages: {
        create: [
          { userId: user.id, role: "user", content: "What should I focus on in the next 3 months?" },
          {
            userId: user.id,
            role: "assistant",
            content:
              "Based on your goal of becoming an AI engineer, and the fact that machine learning evidence is still thin, I would use the next three months this way:\n1. Strengthen Python and the core machine learning ideas in the Foundations phase.\n2. Build one small evaluated project, not a pile of tutorials.\n3. Deploy that project so your software experience stays visible.\n4. Write the result so a resume bullet can stay honest.\n\nI can turn that into a weekly plan if you tell me how many hours you actually have.",
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
