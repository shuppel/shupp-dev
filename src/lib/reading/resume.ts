// The resume's content, shared by /resume/ and its JSON twin /resume.json.
// Inline marks in strings: **bold** and @@metric@@ (rendered as a highlight).

import { siteConfig } from '../../config/site';

export interface ExperienceItem {
  company: string;
  logo?: string;
  title: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  duration: string;
  location: string;
  context?: string;
  bullets?: string[];
  governance?: string[];
  isCurrent?: boolean;
  website?: string;
}

export const experiences: ExperienceItem[] = [
  {
    company: "Steampunk",
    title: "Senior Product Manager",
    employmentType: "Full-time",
    startDate: "Aug 2026",
    duration: "Present",
    location: "Washington, DC Metro Area",
    bullets: [
      "Senior Product Manager over the USCG Beacon Program (50 people) and part of core leadership, guiding 6 product teams that deliver AI and Big Data products and services to the entire U.S. Coast Guard",
      "Created Product Punks on Punk University (PunkU), a 5-star rated course that drew C-suite attention for concepts such as Design as Spec and PRDs",
      "Introduced commercial product development best practices for building technical products",
      "Took over an incumbent project and had the development team write Product Technical Summaries of how each product exists in the codebase"
    ],
    isCurrent: true
  },
  {
    company: "A-Frame Solutions",
    title: "AI Product Manager / GTM",
    employmentType: "Contract",
    startDate: "Mar 2025",
    endDate: "Jun 2026",
    duration: "1 yr 3 mos",
    location: "Arlington, VA",
    context: "ArcSuiteAI (@@$5.4M ARR@@) — AI procurement-lifecycle SaaS for federal agencies",
    bullets: [
      "Ran daily scrums and backlog discussions for an 11-person Agile pod through **FedRAMP Moderate** and **IRS ATO**.",
      "Drove AI strategy and implementation: moved developers to multi-terminal TUI agents (OpenCode, Claude Code) alongside Cursor workflows — sharply increasing developer throughput. Researched prompt engineering and RAG (Pinecone / GraphRAG).",
      "Built the product design and branding for the ArcSuiteAI line (ArcCompose, ArcInsight, ArcTracker, ArcSelect, ArcPropose) — messaging architecture, design system, and content strategy.",
      "Shipped **20+ PRs** with agentic tooling to support the team. Built in TypeScript and Rust/WASM. Prisma → Postgres → AWS GovCloud.",
      "Grew LinkedIn following **16x** in two weeks (12 → 200) including a viral thought-leadership piece — product walkthroughs validated B2G positioning vs. competitors.",
      "Negotiated a FedRAMP partner from $250K to $155K (@@38% savings@@) via willingness-to-pay analysis; built the VC outreach strategy for angel investors.",
    ],
    governance: ["FedRAMP Moderate", "IRS ATO"],
    isCurrent: false
  },
  {
    company: "Disca",
    title: "Fractional CTO",
    employmentType: "Contract",
    startDate: "Mar 2025",
    duration: "Present",
    location: "Remote / Phoenix, AZ",
    context: "Clinical Trial Management Client",
    bullets: [
      "Working with 3 developers and two SMEs to build a Clinical Trials Data Platform.",
      "Orchestrate meetings and demos with the business owner to showcase product features and value.",
      "Provide strategy, technical architecture, and direction to developers to build better products.",
      "Provide executive strategy across growth, operations, product, and marketing vectors.",
    ],
    governance: ["HIPAA", "FISMA"],
    isCurrent: true
  },
  {
    company: "Nodetus Integrators LLC",
    title: "Founder & Managing Director",
    employmentType: "Self-employed",
    startDate: "Jan 2017",
    endDate: "Jun 2026",
    duration: "9 yrs 6 mos",
    location: "Arlington, VA",
    context: "AI services firm; federal B2B",
    bullets: [
      "Built enterprise GTM from zero: **$1.1M+** cumulative revenue (six subcontracts), @@40%@@ YoY growth, @@90%@@ renewal rate over 8+ years with 2.5 FTE peak headcount.",
      "Clients: Disca, Sprezzatura, A-Frame Solutions, MAXIMUS, IME, AFI. Worked with HHS, NIH, Commerce, IRS.",
      "Active participation at ACT-IAC community (Acquisitions and Project Management COIs).",
    ],
    isCurrent: false
  },
  {
    company: "Tria Federal",
    title: "Sr. Technical Project Manager",
    employmentType: "Full-time",
    startDate: "Apr 2020",
    endDate: "Mar 2025",
    duration: "5 yrs",
    location: "Arlington, VA · Remote",
    context: "VA EHR Modernization, multi-vendor program",
    bullets: [
      "Authored Scrum Master playbooks adopted program-wide across **20+ interface teams (400+ people)**; took **15+ interfaces LIVE** at VA Hospitals.",
      "Migrated legacy languages to modern FHIR — crosswalked legacy systems (MUMPS) to Cerner/Oracle and built FHIR/HL7 calls from hospital systems.",
      "Hand-coded a Python + Excel utility that cut new-interface setup from days to minutes — an estimated @@$160K@@ in annual cross-team labor savings.",
      "Managed ATOs with security and compliance leads, maintaining **HIPAA** and **SOC2** compliance across hospital systems and patient data.",
    ],
    governance: ["HIPAA", "SOC2", "ATO"],
    isCurrent: false
  },
  {
    company: "MAXIMUS",
    title: "Technical Agile Product Delivery Lead",
    employmentType: "Full-time",
    startDate: "2019",
    endDate: "2020",
    duration: "1 yr 1 mo",
    location: "Vienna, VA",
    context: "Large billion-dollar GovTech & services firm",
    bullets: [
      "PM for Genesys FedRAMP: managed a **50-person team** spanning security, operations, data warehouse, on-prem, and AWS engineers/architects.",
      "NIH Technical Help Desk liaison: single-handedly converted physical certification courses to online during COVID — process, testing, and videos — driving re-engagement across **6 subcontracts** (2019–2024).",
      "Built digital and Agile strategy for a $1B company with the CTO, VP of Technology, and VP of Agile Services — playbooks used org-wide.",
      "Served as scrum master and business analyst during tech demos and orals, building technical solutions from SME consultations.",
    ],
    governance: ["FedRAMP"],
    isCurrent: false
  },
  {
    company: "RWD Consulting LLC",
    title: "Proposal Manager / Technical PM",
    employmentType: "Full-time",
    startDate: "2018",
    endDate: "2019",
    duration: "1 yr 2 mos",
    location: "Washington, DC",
    context: "8(a) services firm",
    bullets: [
      "Proposal + capture: drove **14 contract wins**, @@165%@@ revenue growth ($8M → $21M). Submitted 30 proposals and assisted in orals.",
      "Built a customized SharePoint platform with Flow automation to manage BD team opportunities.",
      "Managed 6 FTEs (4 developers, 2 support) at DHS TSA in Crystal City, VA.",
    ],
    isCurrent: false
  },
  {
    company: "Highlight Technologies",
    title: "Proposal Manager",
    employmentType: "Full-time",
    startDate: "2016",
    endDate: "2017",
    duration: "1 yr 1 mo",
    location: "Fairfax, VA",
    context: "8(a) services firm",
    bullets: [
      "Drove a @@35%@@ increase in proposal win rate and supported @@102%@@ company growth ($10M → $20.12M) with **12 contract wins** — early sales-enablement and competitive-positioning at scale.",
    ],
    isCurrent: false
  },
  {
    company: "Quick Services LLC",
    title: "Proposal Manager",
    employmentType: "Full-time",
    startDate: "2015",
    endDate: "2016",
    duration: "1 yr",
    location: "Remote / Bozeman, MT",
    context: "SDVOSB DoD contractor",
    bullets: [
      "Direct report to the VP of BD. The SDVOSB specialized in warfighter and asymmetric warfare support, with major clients at Fort Bragg, NC.",
    ],
    isCurrent: false
  }
];

export const otherExperience = [
  { company: "DRT Strategies", title: "Proposal Manager", dates: "2014 — 2015" },
  { company: "CapRelo", title: "Proposal Coordinator", dates: "2013 — 2014" },
];

export const coreCompetencies = [
  "AI-Native Delivery",
  "Agentic Tooling",
  "Agile / Scrum",
  "Health IT",
  "Product Management",
  "GTM Strategy",
  "Capture Management",
  "Proposal Development",
  "Executive Strategy",
  "Product Marketing",
  "FedRAMP / ATO",
  "Vendor Negotiation",
];

export const techStack = [
  "Prisma",
  "PostgreSQL",
  "Cloudflare",
  "Rust / WASM",
  "Solid.js",
  "Next.js",
  "Anthropic SDK",
  "AWS GovCloud",
  "FHIR / HL7",
  "Supabase",
  "Python",
  "Claude Code",
];

export const education = [
  {
    school: "George Mason University",
    degree: "M.S., Technology Management",
    detail: "Apr 2020 · 3.74 GPA",
  },
  {
    school: "Longwood University",
    degree: "B.A., English",
    detail: "Apr 2012",
  }
];

export const certifications = [
  "AWS Certified Cloud Practitioner",
  "Product School — PMC",
  "Nielsen Norman Group — UXMC (~2,000 globally)",
  "SAFe 4 Practitioner",
  "ITIL v4 Foundation",
];

export const specializations = [
  { title: "Digital Healthcare Informatics & AI", org: "Illinois Tech" },
  { title: "AI Agents with Model Context Protocol", org: "Vanderbilt University" },
  { title: "Supervised Machine Learning", org: "DeepLearning.AI" },
  { title: "Algorithms & Data Structures", org: "UC San Diego" },
  { title: "Python for Everybody", org: "University of Michigan" },
  { title: "PostgreSQL for Everybody", org: "University of Michigan" },
  { title: "Introduction to Computer Programming", org: "University of London" },
  { title: "Computer Communications", org: "University of Colorado" },
  { title: "Finance & Quantitative Modeling", org: "University of Pennsylvania" },
  { title: "Precalculus through Data & Modeling", org: "Johns Hopkins University" },
  { title: "Digital Marketing", org: "University of Illinois" },
  { title: "Search Engine Optimization (SEO)", org: "UC Davis" },
  { title: "RPA Specialization", org: "UiPath" },
  { title: "Pre-Security Learning Path", org: "TryHackMe" },
];

export const contactItems = [
  { label: "erikk@shupp.dev", href: "mailto:erikk@shupp.dev" },
  { label: "703-618-4953", href: "tel:+17036184953" },
  { label: "shupp.dev", href: "https://www.shupp.dev" },
  { label: "in/shupp-erikk", href: "https://www.linkedin.com/in/shupp-erikk" },
  { label: "Washington, DC" },
];

export const resumeHeadline = {
  name: 'Erikk Shupp',
  role: 'Sr. Technical Product Manager',
  focus: ['AI-Native', 'Health IT', 'Procurement & Acquisitions', 'Executive Strategy'],
  summary:
    'Senior technical product manager spanning federal GovTech, health IT, and AI-native delivery. **8+ years** building enterprise GTM, modernizing clinical and EHR systems, and steering Agile programs through **FedRAMP** and **ATO**, pairing product strategy, design, and hands-on engineering.',
};

/** **bold** -> <strong>, @@metric@@ -> highlighted span. */
export const renderEmphasis = (s: string) =>
  s.replace(/@@(.+?)@@/g, '<mark class="metric">$1</mark>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** Plain text, marks removed, for the JSON twin. */
export const plain = (s: string) => s.replace(/@@(.+?)@@/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1');

const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export function resumeJson() {
  return {
    $format: 'shupp-page@0.1',
    id: 'resume',
    kind: 'resume',
    url: abs('/resume/'),
    json: abs('/resume.json'),
    title: `Resume - ${resumeHeadline.name}`,
    person: { name: resumeHeadline.name, role: resumeHeadline.role, focus: resumeHeadline.focus, url: abs('/about/') },
    summary: plain(resumeHeadline.summary),
    contact: contactItems.map((c) => ({ label: c.label, href: c.href ?? null })),
    experience: experiences.map((e) => ({
      company: e.company,
      title: e.title,
      employmentType: e.employmentType,
      start: e.startDate,
      end: e.endDate ?? null,
      current: Boolean(e.isCurrent),
      location: e.location,
      context: e.context ? plain(e.context) : null,
      highlights: (e.bullets ?? []).map(plain),
      governance: e.governance ?? [],
    })),
    otherExperience,
    competencies: coreCompetencies,
    tech: techStack,
    education,
    certifications,
    specializations,
  };
}
