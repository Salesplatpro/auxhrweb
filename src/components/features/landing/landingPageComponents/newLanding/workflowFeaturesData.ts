import adebanjiBolaji from './assets/avatar-adebanji-bolaji.png'
import adegboyogaPrecious from './assets/avatar-adegboyoga-precious.png'
import babaKaothat from './assets/avatar-baba-kaothat.png'
import damilareUsman from './assets/avatar-damilare-usman.png'
import desmondTutu from './assets/avatar-desmond-tutu.png'
import jibikeAlarape from './assets/avatar-jibike-alarape.png'
import jibikeAlarapeAlt from './assets/avatar-jibike-alarape-alt.png'
import jideKosoko from './assets/avatar-jide-kosoko.png'
import olaideBamisebi from './assets/avatar-olaide-bamisebi.png'
import titiOmolara from './assets/avatar-titi-omolara.png'
import titilayoBabatunde from './assets/avatar-titilayo-babatunde.png'

type ScoresVisual = {
  kind: 'scores'
  url?: string
  questions?: { text: string; weight: string }[]
  items: {
    label: string
    score: string
    // Bar fill as a percent of the track, taken from Figma rather than `score`.
    fill: number
    tone: 'blue' | 'orange' | 'green'
    largeLabel?: boolean
    largeScore?: boolean
  }[]
}

type JobsVisual = {
  kind: 'jobs'
  items: {
    title: string
    meta: string
    status: 'open' | 'closed'
    applicants: string
  }[]
}

export type Recruiter = {
  name: string
  role: string
  avatar: string
  tone: 'pink' | 'blue' | 'amber'
}

type RecruitersVisual = {
  kind: 'recruiters'
  rows: Recruiter[][]
}

type StatsVisual = {
  kind: 'stats'
  stats: { value: string; label: string; large?: boolean }[]
  bars: { height: number; highlight?: boolean }[]
}

type PipelineVisual = {
  kind: 'pipeline'
  label: string
  stages: { title: string; meta: string; count: number }[]
}

export type WorkflowVisual =
  | ScoresVisual
  | JobsVisual
  | RecruitersVisual
  | StatsVisual
  | PipelineVisual

export type WorkflowFeature = {
  id: string
  eyebrow?: string
  title: string
  description: string
  points: string[]
  visualFirst: boolean
  visual: WorkflowVisual
}

const recruiters = {
  adebanji: {
    name: 'Adebanji Bolaji',
    role: 'Snr Hiring Manager',
    avatar: adebanjiBolaji,
    tone: 'pink',
  },
  titi: {
    name: 'Titi Omolara Emmanuel',
    role: 'Recruiter',
    avatar: titiOmolara,
    tone: 'pink',
  },
  olaide: {
    name: 'Olaide Bamisebi',
    role: 'Snr Hiring Mgr',
    avatar: olaideBamisebi,
    tone: 'blue',
  },
  baba: {
    name: 'Baba Kaothat',
    role: 'Hiring Mgr',
    avatar: babaKaothat,
    tone: 'amber',
  },
  jibike: {
    name: 'Jibike Alarape',
    role: 'Snr Hiring Mgr',
    avatar: jibikeAlarape,
    tone: 'blue',
  },
  damilare: {
    name: 'Damilare Usman',
    role: 'Snr Hiring Manager',
    avatar: damilareUsman,
    tone: 'pink',
  },
  jibikeAlt: {
    name: 'Jibike Alarape',
    role: 'Hiring Mgr',
    avatar: jibikeAlarapeAlt,
    tone: 'amber',
  },
  jide: {
    name: 'Jide Kosoko',
    role: 'Snr Hiring Manager',
    avatar: jideKosoko,
    tone: 'pink',
  },
  titilayo: {
    name: 'Titilayo Babatunde',
    role: 'Snr Recruiter',
    avatar: titilayoBabatunde,
    tone: 'amber',
  },
  adegboyoga: {
    name: 'Adegboyoga Precious',
    role: 'Recruiter',
    avatar: adegboyogaPrecious,
    tone: 'pink',
  },
  desmond: {
    name: 'Desmond Tutu',
    role: 'Snr Hiring Mgr',
    avatar: desmondTutu,
    tone: 'blue',
  },
} satisfies Record<string, Recruiter>

export const scoresVisual: ScoresVisual = {
  kind: 'scores',
  items: [
    { label: 'CV Match', score: '50%', fill: 51.74, tone: 'blue' },
    {
      label: 'Screening Answers',
      score: '69%',
      fill: 70.02,
      tone: 'orange',
      largeScore: true,
    },
    {
      label: 'Personality Fit',
      score: '85%',
      fill: 88.27,
      tone: 'green',
      largeLabel: true,
      largeScore: true,
    },
  ],
}

export const jobsVisual: JobsVisual = {
  kind: 'jobs',
  items: [
    {
      title: 'Sales Representative',
      meta: 'Marketing - Fulltime',
      status: 'open',
      applicants: '34 applicants',
    },
    {
      title: 'Product Designer',
      meta: 'Design - Fulltime',
      status: 'open',
      applicants: '21 applicants',
    },
    {
      title: 'Backend Engineer',
      meta: 'Engineering - Contract',
      status: 'closed',
      applicants: '58 applicants',
    },
  ],
}

export const statsVisual: StatsVisual = {
  kind: 'stats',
  stats: [
    { value: '32', label: 'Applications this week', large: true },
    { value: '71%', label: 'Avg. CV match score' },
    { value: '4', label: 'Open Roles' },
    { value: '12', label: 'Shortlisted' },
  ],
  bars: [
    { height: 28 },
    { height: 39 },
    { height: 28 },
    { height: 37, highlight: true },
    { height: 28 },
    { height: 37 },
    { height: 46, highlight: true },
  ],
}

export const workflowFeatures: WorkflowFeature[] = [
  {
    id: 'find-talent',
    title: 'Find the right talent',
    description:
      'Go beyond simple keywords. AuxHR identifies deep skill alignment, verified career trajectories, and actual portfolio impact across disparate sources.',
    points: [
      'Leverage automation to move fast',
      'Always give customers a human to chat to',
      'Automate customer support and close leads faster',
    ],
    visualFirst: false,
    visual: scoresVisual,
  },
  {
    id: 'screen-smarter',
    title: 'Screen smarter',
    description:
      'Eliminate manual review marathons. Real-time automated resume parsing extracts concrete signals while filtering noise and formatting tricks.',
    points: [
      'Keep your customers in the loop with live chat',
      'Embed help articles right on your website',
      'Customers never have to leave the page to find an answer',
    ],
    visualFirst: true,
    visual: jobsVisual,
  },
  {
    id: 'collaborative-hiring',
    title: 'Collaborative hiring, Simplified workflows',
    description:
      'Keep hiring managers, recruiters, and executives seamlessly aligned in a unified workspace connecting sourcing, scorecard generation, interviewer scheduling, and offer letters.',
    points: [
      'Filter, export, and drilldown on the data quickly',
      'Zero tab-switching',
      'Connect the tools you already use with 100+ integrations',
    ],
    visualFirst: false,
    visual: {
      kind: 'recruiters',
      rows: [
        [recruiters.adebanji, recruiters.titi, recruiters.olaide],
        [
          recruiters.baba,
          recruiters.jibike,
          recruiters.damilare,
          recruiters.jibike,
        ],
        [recruiters.jibikeAlt, recruiters.jide, recruiters.titilayo],
        [
          recruiters.adebanji,
          recruiters.adegboyoga,
          recruiters.desmond,
          recruiters.damilare,
        ],
      ],
    },
  },
  {
    id: 'hire-without-chaos',
    title: 'Hire without the chaos',
    description:
      'End-to-end synchronized hiring flow keeps recruiters, hiring managers, and interviewers working in seamless lockstep across pipeline stages.',
    points: [
      'Keep your customers in the loop with live chat',
      'Embed help articles right on your website',
      'Customers never have to leave the page to find an answer',
    ],
    visualFirst: true,
    visual: statsVisual,
  },
]
