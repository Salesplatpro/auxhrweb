import { HowItWorksStep } from '../howItWorksStepsData'
import {
  jobsVisual,
  scoresVisual,
  statsVisual,
  WorkflowFeature,
  WorkflowVisual,
} from '../workflowFeaturesData'

export const hiringPipeline: WorkflowVisual = {
  kind: 'pipeline',
  label: 'Hiring pipeline',
  stages: [
    { title: 'Applied', meta: 'Across 4 open roles', count: 128 },
    {
      title: 'Screened by AI',
      meta: 'Scored against your criteria',
      count: 86,
    },
    {
      title: 'Assessment passed',
      meta: 'Pre-assessment and personality',
      count: 31,
    },
    { title: 'Shortlisted', meta: 'Ready for interview', count: 12 },
    { title: 'Offer sent', meta: 'Awaiting response', count: 3 },
  ],
}

export const platformFeatures: HowItWorksStep[] = [
  {
    id: 'ai-configuration',
    number: '01',
    title: 'AI Configuration',
    description:
      'Set screening questions, weights and pass marks per role, and the AI applies them to every applicant.',
    card: {
      kind: 'choices',
      control: 'toggle',
      items: [
        { label: 'CV matching', on: true },
        { label: 'Personality fit', on: true },
        { label: 'Pre assessment', on: false },
      ],
    },
  },
  {
    id: 'cv-matching',
    number: '02',
    title: 'CV Matching',
    description:
      'Resume benchmarked against your actual requirements, not keyword guesswork.',
    card: {
      kind: 'compare',
      score: '92',
      left: {
        title: 'Role Requires',
        text: 'Outbound sales CRM reporting 5+ years',
      },
      right: {
        title: 'CV Shows',
        text: 'Outbound sales CRM reporting 6 years',
      },
    },
  },
  {
    id: 'pre-assessment',
    number: '03',
    title: 'Pre-Assessment Tests',
    description:
      'Question banks, automated scoring and instant result reporting for both sides.',
    card: {
      kind: 'choices',
      control: 'radio',
      items: [
        { label: '5+ Years', on: true },
        { label: '3-5 Years', on: false },
        { label: '1-2 Years', on: false },
      ],
    },
  },
  {
    id: 'personality-fit',
    number: '04',
    title: 'Personality & Role Fit',
    description:
      'Combine trait profiles with role expectations to see who will thrive, not just who qualifies.',
    card: { kind: 'bars', heights: [48, 88, 120, 88, 48] },
  },
  {
    id: 'dashboards',
    number: '05',
    title: 'Dashboards',
    description:
      'Applications, screenings and CV matches for the week, roles posted against roles filled.',
    card: {
      kind: 'chart',
      stats: [
        { value: '128', label: 'Applied' },
        { value: '86', label: 'Screened' },
      ],
      heights: [14, 22, 14, 28, 18, 26, 20],
    },
  },
  {
    id: 'notifications-chat',
    number: '06',
    title: 'Notifications & Chat',
    description:
      'In-app and email on every status change, plus direct messaging with candidates.',
    card: {
      kind: 'chat',
      messages: [
        { text: 'Congrats! You are shortlisted', mine: false },
        { text: 'Thanks, I am available Tuesday', mine: true },
      ],
    },
  },
]

export const talentWorkflowFeatures: WorkflowFeature[] = [
  {
    id: 'ai-configuration',
    eyebrow: 'For hiring teams & talents',
    title: 'AI Configuration & CV Matching',
    description:
      'Set the questions, weights and benchmarks once. Every applicant is tested against your criteria and unqualified resumes are filtered out by the system.',
    points: [
      'Screening questions and score ratings set by the hiring manager',
      'Personality test combinations selected per role',
      'CV matching requirements defined in your own words',
      'Candidates receive their result and move forward automatically',
    ],
    visualFirst: false,
    visual: {
      ...scoresVisual,
      url: 'auxhr.app/pipelines/sales-representative',
      questions: [
        { text: 'Years managing an outbound sales pipeline', weight: 'High' },
        { text: 'Experience with CRM reporting', weight: 'Medium' },
        { text: 'Comfortable with quota based targets', weight: 'High' },
      ],
    },
  },
  {
    id: 'job-posts',
    title: 'Job Posts',
    description:
      'Create a role once, and every application that comes in is already sorted, filtered, scored and ready for you to act on.',
    points: [
      'Rich job creation: role, requirements and salary range',
      'Filter applicants by CV match, stage and status',
      'Move a candidate from applied to shortlisted in one click',
    ],
    visualFirst: true,
    visual: jobsVisual,
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    description:
      'Applications, screening results and CV matches, all in one view with every pipeline stage updated live as candidates move through it.',
    points: [
      'Weekly application and screening volume',
      'Built for both recruiters and talents',
      'Roles filled vs open, tracked against your hiring goals',
    ],
    visualFirst: false,
    visual: statsVisual,
  },
]

export const integrationGroups = [
  {
    title: 'Job Boards',
    names: [
      'LinkedIn',
      'Indeed',
      'Jobberman',
      'Glassdoor',
      'Hot Nigerian Jobs',
      'MyJobMag',
      'Career24',
      'FlexJobs',
    ],
  },
  {
    title: 'HR & ATS tools',
    names: [
      'BambooHR',
      'Zoho',
      'Workable',
      'Deel',
      'Rippling',
      'SmartRecruiters',
      'Taleo',
      'Recruiterflow',
    ],
  },
]
