import { ONBOARDING_PATHS } from '@/features/onboarding/paths'
import { OnboardingStage } from '@/features/profile/types'

export type TourRole = 'recruiter' | 'talent'

export interface TourStep {
  /** Matches a `data-tour` attribute; steps without one show in the middle of the screen. */
  target?: string
  title: string
  body: string
  why?: string
  /** The page the target lives on; the tour goes there when the step opens. */
  route?: string
  /** Where clicking the target leads; offered as "Take me there" when the target can't be found. */
  to?: string
  /** Skips the step when the user is already past it, e.g. already on the page it opens. */
  skipWhen?: (pathname: string) => boolean
  /** `click` waits for a click on the target; `stage` waits for the user to finish the step on the page. */
  advanceOn?: 'click' | 'stage'
}

export const RECRUITER_TOUR: TourStep[] = [
  {
    title: 'Welcome to Auxhr',
    body: 'Here’s a one-minute look at where things are. You can skip anytime and replay it from the Guide.',
  },
  {
    target: 'company-switcher',
    title: 'Your company',
    body: 'Set up your company first — jobs are posted under it. Switch companies or invite teammates here.',
  },
  {
    target: 'nav-post-job',
    title: 'Post a Job',
    body: 'Create a job with AI or from scratch, choose how applicants are screened, then publish.',
  },
  {
    target: 'nav-my-job-posts',
    title: 'My Job Posts',
    body: 'Every job you posted, with its applicants already scored and ranked so you can start with the strongest.',
  },
  {
    target: 'nav-scout',
    title: 'Scout',
    body: 'Have CVs from elsewhere? Upload them in bulk and AI scores each one against your job.',
  },
  {
    target: 'nav-talent-search',
    title: 'Talent Search',
    body: 'Find talents already on Auxhr by role, experience and location.',
  },
  {
    target: 'nav-chat',
    title: 'Chat and Shortlist',
    body: 'Message talents directly, and keep everyone you shortlisted in one place.',
  },
  {
    target: 'nav-guide',
    title: 'Guide',
    body: 'Short answers on every page and field. You can replay this tour from there.',
  },
  {
    target: 'profile-menu',
    title: 'Your account',
    body: 'Your profile, plan, password and light or dark mode live here. The bell shows notifications.',
  },
]

export const TALENT_TOUR: TourStep[] = [
  {
    title: 'Welcome to Auxhr',
    body: 'Here’s a quick look around so you know where everything is. You can skip anytime.',
  },
  {
    target: 'profile-menu',
    title: 'Finish your profile',
    body: 'Add your roles and upload your CV first. Employers see your profile, and AI uses it to match you to jobs.',
  },
  {
    target: 'nav-pre-assessment',
    title: 'Pre-assessment test',
    body: 'Take this once. Your score is reused for every job you apply to, so give it your best.',
  },
  {
    target: 'nav-jobs',
    title: 'Jobs',
    body: 'Browse open jobs and apply. Each job shows the steps you’ll go through.',
  },
  {
    target: 'nav-pipeline',
    title: 'Applications pipeline',
    body: 'See where each application is, and finish any steps that are waiting for you.',
  },
  {
    target: 'nav-inbox',
    title: 'Inbox',
    body: 'Messages from employers land here.',
  },
  {
    target: 'nav-notifications',
    title: 'Notifications',
    body: 'Updates on your applications, so you never miss a next step.',
  },
]

export const TOUR_STEPS: Record<TourRole, TourStep[]> = {
  recruiter: RECRUITER_TOUR,
  talent: TALENT_TOUR,
}

const withinPage = (page: string) => (pathname: string) => {
  const current = pathname.replace(/\/+$/, '')
  return current === page || current.startsWith(`${page}/`)
}

const RECRUITER_HOME_PAGE = '/recruiterDashboard/dashboard'
const POST_JOB_PAGE = '/recruiterDashboard/postjob'
const MY_JOBS_PAGE = '/recruiterDashboard/myJobPosts'

const TALENT_PROFILE_PAGE = '/talentDashboard/talentProfile'
const TALENT_JOBS_PAGE = '/talentDashboard/job'

export const STAGE_TOURS: Partial<Record<OnboardingStage, TourStep[]>> = {
  complete_profile: [
    {
      target: 'profile-bio',
      route: TALENT_PROFILE_PAGE,
      title: 'Complete your profile',
      body: 'Start with a short bio about your work and what you are good at.',
      why: 'It is the first thing a recruiter reads, and AI uses it to match you.',
    },
    {
      target: 'profile-role',
      route: TALENT_PROFILE_PAGE,
      title: 'Pick your roles',
      body: 'Choose the roles you want to work in.',
      why: 'Jobs are matched to your roles, so this decides what you see.',
    },
    {
      target: 'profile-fit',
      route: TALENT_PROFILE_PAGE,
      title: 'Experience, work type and location',
      body: 'Set your experience level, how you want to work and where you are.',
      why: 'These decide which jobs fit you and where employers can place you.',
    },
    {
      target: 'profile-salary',
      route: TALENT_PROFILE_PAGE,
      title: 'Your salary range',
      body: 'Pick a currency, a minimum and maximum, and a pay period.',
      why: 'It keeps offers close to what you expect.',
    },
    {
      target: 'profile-cv',
      route: TALENT_PROFILE_PAGE,
      title: 'Upload your CV',
      body: 'Upload a PDF or DOCX. It saves as soon as the upload finishes.',
      why: 'AI reads it to score your fit for each job, and employers can view it.',
    },
    {
      target: 'profile-form',
      route: TALENT_PROFILE_PAGE,
      advanceOn: 'stage',
      title: 'Save your profile',
      body: 'Fill in anything still empty, then press Save.',
      why: 'Your pre-assessment unlocks only when every field is complete.',
    },
  ],
  take_assessment: [
    {
      target: 'nav-pre-assessment',
      advanceOn: 'click',
      to: '/talentDashboard/talentQuiz',
      title: 'Take your pre-assessment',
      body: 'Open it when you have about 20 quiet minutes. It starts right away and locks the app until you finish.',
      why: 'You take it once, and your score is reused for every job you apply to.',
    },
  ],
  apply_to_job: [
    {
      target: 'nav-jobs',
      advanceOn: 'click',
      to: TALENT_JOBS_PAGE,
      skipWhen: withinPage(TALENT_JOBS_PAGE),
      title: 'Find a job',
      body: 'Open Jobs to see openings that match your roles.',
      why: 'Applying is how employers get to see you.',
    },
    {
      target: 'job-card',
      route: TALENT_JOBS_PAGE,
      skipWhen: (pathname) => pathname.startsWith(`${TALENT_JOBS_PAGE}/`),
      advanceOn: 'click',
      title: 'Open a job',
      body: 'Pick a job that fits you and open it to read the details.',
      why: 'Each job shows the steps you will go through.',
    },
    {
      target: 'apply-job',
      advanceOn: 'stage',
      title: 'Apply',
      body: 'Read the role, then press Apply for this position.',
      why: 'It starts your application, and your pre-assessment score is reused.',
    },
  ],
  create_company: [
    {
      target: 'create-company',
      route: RECRUITER_HOME_PAGE,
      advanceOn: 'click',
      to: ONBOARDING_PATHS.company,
      title: 'Set up your company',
      body: 'Press Create company and add your name, industry and a website or LinkedIn. It takes about 2 minutes.',
      why: 'Jobs are posted under your company, and candidates see it.',
    },
  ],
  post_job: [
    {
      target: 'nav-post-job',
      advanceOn: 'click',
      to: POST_JOB_PAGE,
      skipWhen: withinPage(POST_JOB_PAGE),
      title: 'Post your first job',
      body: 'Open Post a Job to describe the role you are hiring for.',
      why: 'Applicants and screening both start from a job.',
    },
    {
      target: 'post-job-content',
      advanceOn: 'stage',
      title: 'Describe the role',
      body: 'Let AI draft it from a sentence, or start from scratch. Check the details, then continue to screening.',
      why: 'Applicants and AI screening both work from this brief.',
    },
  ],
  set_up_screening: [
    {
      target: 'nav-my-job-posts',
      advanceOn: 'click',
      to: MY_JOBS_PAGE,
      skipWhen: withinPage(POST_JOB_PAGE),
      title: 'Finish your draft',
      body: 'Open My Job Posts to find the job you started.',
      why: 'A job needs a screening setup before it can be published.',
    },
    {
      target: 'add-ai-config',
      route: MY_JOBS_PAGE,
      advanceOn: 'click',
      skipWhen: withinPage(POST_JOB_PAGE),
      title: 'Add the screening setup',
      body: 'Press Add AI Config on your draft job.',
      why: 'It decides which tests applicants take before you see them.',
    },
    {
      target: 'ai-config',
      advanceOn: 'stage',
      title: 'Choose how applicants are screened',
      body: 'Pick a preset (Balanced suits most roles), adjust anything, then press Save and review.',
      why: 'Each part adds a step candidates complete before they reach you.',
    },
  ],
}

export interface PageTour {
  id: string
  role: TourRole
  /** The tour belongs to this page and everything under it. */
  path: string
  steps: TourStep[]
}

export const PAGE_TOURS: PageTour[] = [
  {
    id: 'talent-pipeline',
    role: 'talent',
    path: '/talentDashboard/applicationPipeline',
    steps: [
      {
        title: 'Your applications',
        body: 'Every job you applied to is listed here with the stage it is at.',
        why: 'You see at a glance where each one stands.',
      },
      {
        title: 'Finish waiting steps',
        body: 'If a job shows a test or task, open it and complete it.',
        why: 'Finishing every stage raises your ranking for that job.',
      },
    ],
  },
  {
    id: 'talent-jobs',
    role: 'talent',
    path: '/talentDashboard/job',
    steps: [
      {
        title: 'Find jobs',
        body: 'Search and filter open jobs. Open one to see its steps before you apply.',
        why: 'Each job can screen applicants differently.',
      },
    ],
  },
  {
    id: 'talent-inbox',
    role: 'talent',
    path: '/talentDashboard/chat',
    steps: [
      {
        title: 'Your inbox',
        body: 'Employers who want to talk to you message you here. Reply from this page.',
        why: 'A quick reply keeps you in the running.',
      },
    ],
  },
  {
    id: 'talent-notifications',
    role: 'talent',
    path: '/talentDashboard/notification',
    steps: [
      {
        title: 'Notifications',
        body: 'Updates on your applications show up here.',
        why: 'So you never miss a next step.',
      },
    ],
  },
  {
    id: 'recruiter-my-job-posts',
    role: 'recruiter',
    path: MY_JOBS_PAGE,
    steps: [
      {
        title: 'Your jobs',
        body: 'Each job shows its status and how many people applied. Open one to see its applicants.',
        why: 'Applicants are already scored, so you start with the strongest.',
      },
      {
        title: 'Share and publish',
        body: 'Share active jobs with their link, and publish drafts when they are ready.',
        why: 'Only published jobs can receive applications.',
      },
    ],
  },
  {
    id: 'recruiter-applicants',
    role: 'recruiter',
    path: '/recruiterDashboard/singleJobPost',
    steps: [
      {
        title: 'Ranked applicants',
        body: 'Applicants are scored against your job and listed best first. Open one for the full report.',
        why: 'You can skip the CV pile and start with the best fits.',
      },
      {
        title: 'Shortlist',
        body: 'Shortlist the people you like. Everyone you shortlist is kept on the Shortlist page.',
        why: 'Your best candidates stay in one place.',
      },
    ],
  },
  {
    id: 'recruiter-scout',
    role: 'recruiter',
    path: '/recruiterDashboard/scout',
    steps: [
      {
        title: 'Scout',
        body: 'Upload CVs you already have in bulk, and AI scores each one against your job.',
        why: 'You get a ranked list without screening by hand.',
      },
    ],
  },
  {
    id: 'recruiter-talent-search',
    role: 'recruiter',
    path: '/recruiterDashboard/talent-search',
    steps: [
      {
        title: 'Talent Search',
        body: 'Find talents already on Auxhr by role, experience and location.',
        why: 'You can reach good candidates who have not applied yet.',
      },
    ],
  },
  {
    id: 'recruiter-shortlist',
    role: 'recruiter',
    path: '/recruiterDashboard/shortlist',
    steps: [
      {
        title: 'Your shortlist',
        body: 'Everyone you shortlisted is kept here, across all your jobs.',
        why: 'Your best candidates are always one click away.',
      },
    ],
  },
  {
    id: 'recruiter-chat',
    role: 'recruiter',
    path: '/recruiterDashboard/chat',
    steps: [
      {
        title: 'Chat',
        body: 'Message talents directly and pick conversations up where you left off.',
        why: 'Fast replies keep good candidates interested.',
      },
    ],
  },
  {
    id: 'recruiter-plan',
    role: 'recruiter',
    path: '/recruiterDashboard/plan',
    steps: [
      {
        title: 'Plan and billing',
        body: 'See your plan, what it allows, and your billing history here.',
        why: 'Know your limits before you hit one.',
      },
    ],
  },
]

export const pageTourFor = (role: TourRole, pathname: string) =>
  PAGE_TOURS.find(
    (tour) => tour.role === role && withinPage(tour.path)(pathname),
  )
