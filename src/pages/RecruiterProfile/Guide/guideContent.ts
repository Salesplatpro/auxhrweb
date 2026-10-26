export interface GuideEntry {
  id: string
  title: string
  body: string
  tip?: string
}

export interface GuideSection {
  id: string
  title: string
  intro: string
  entries: GuideEntry[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    intro: 'Four steps from sign-up to your first hire.',
    entries: [
      {
        id: 'verify-email',
        title: '1. Verify your email',
        body: 'Click the link we emailed you. Most pages unlock once your email is verified.',
      },
      {
        id: 'set-up-company',
        title: '2. Set up your company',
        body: 'Create your company (or join one you were invited to) from the company switcher at the top of the sidebar. Jobs are posted under a company.',
      },
      {
        id: 'post-first-job',
        title: '3. Post a job',
        body: 'Go to Post a Job. Describe the role, choose how applicants are screened, then publish.',
      },
      {
        id: 'review-applicants',
        title: '4. Review applicants',
        body: 'Open the job in My Job Posts. Applicants arrive already scored and ranked, so you can start with the strongest.',
      },
    ],
  },
  {
    id: 'pages',
    title: 'Pages',
    intro: 'What each page in the sidebar is for.',
    entries: [
      {
        id: 'page-dashboard',
        title: 'Dashboard',
        body: 'A snapshot of your hiring: campaigns, applications received, how many you shortlisted, and the latest applications.',
      },
      {
        id: 'page-post-a-job',
        title: 'Post a Job',
        body: 'Create a job in four steps: Start, Details, Screening and Review. Your progress is saved as you go.',
      },
      {
        id: 'page-my-job-posts',
        title: 'My Job Posts',
        body: 'Every job you posted, with its status and applicant count. Change a status, pay to activate a job, or open a job to see its applicants.',
      },
      {
        id: 'page-applicants',
        title: 'A job’s applicants',
        body: 'Applicants for one job, ranked by CV and AI match. Filter by rank, match level or date, open a candidate to see their answers, strengths and risks, then shortlist, reject or message them. You can download a ranking report.',
      },
      {
        id: 'page-scout',
        title: 'Scout',
        body: 'Score CVs you already have — from a referral or another job board. Create a scout job, upload CVs in bulk, and AI scores each one against it. You can add strong people to a live job’s pipeline.',
      },
      {
        id: 'page-talent-search',
        title: 'Talent Search',
        body: 'Search talents already on Auxhr by role, experience and location, and reach out to them.',
      },
      {
        id: 'page-chat',
        title: 'Chat',
        body: 'Your conversations with talents in one place.',
      },
      {
        id: 'page-shortlist',
        title: 'Shortlist',
        body: 'Everyone you shortlisted across all your jobs, ready for the next stage.',
      },
      {
        id: 'page-company',
        title: 'Company',
        body: 'Open the company switcher at the top of the sidebar. Edit your company as candidates see it, invite teammates, or switch company. New companies are checked by our team before they are verified.',
      },
      {
        id: 'page-plan',
        title: 'Plan',
        body: 'Open your name at the top right, then Plan. See what you have used this period and your plan history, or upgrade to post jobs without paying per job.',
      },
      {
        id: 'page-profile',
        title: 'Profile and notifications',
        body: 'Open your name at the top right to edit your profile, change your password, switch between light and dark mode, or sign out. The bell next to it shows your notifications.',
      },
    ],
  },
  {
    id: 'job-fields',
    title: 'Job fields',
    intro: 'What each field on the Details step means.',
    entries: [
      {
        id: 'field-role',
        title: 'Role',
        body: 'The job title. Pick one from the list or type a new one. It can’t be changed after the job is created.',
      },
      {
        id: 'field-brief',
        title: 'Job brief',
        body: 'What candidates read first: the work, the team and what success looks like. AI also uses it to match CVs and write questions.',
        tip: 'Use the AI buttons above the box to write, shorten or warm up the text.',
      },
      {
        id: 'field-requirements',
        title: 'Requirements',
        body: 'Must-haves and nice-to-haves. CV match and tailored questions are based on this.',
      },
      {
        id: 'field-experience',
        title: 'Experience level',
        body: 'Years of experience you are looking for.',
      },
      {
        id: 'field-work-mode',
        title: 'Work mode and location',
        body: 'Remote, hybrid or on-site. For hybrid and on-site, a country is required; state and city are optional.',
      },
      {
        id: 'field-pay',
        title: 'Pay',
        body: 'Currency, minimum pay and whether it is monthly or yearly. Maximum pay is optional. Candidates see this on the job.',
      },
      {
        id: 'field-skills',
        title: 'Skills',
        body: 'The key skills for the job. Type one and press Enter, or use Suggest skills.',
      },
      {
        id: 'field-goals',
        title: 'Goals',
        body: 'What the new hire should achieve. It helps candidates picture the job.',
      },
    ],
  },
  {
    id: 'screening',
    title: 'Screening settings',
    intro:
      'How applicants are checked before they reach you. Start from a preset, then change anything.',
    entries: [
      {
        id: 'screening-presets',
        title: 'Presets',
        body: 'Light, Balanced and Thorough fill in every setting for you. Change any setting and the setup becomes Custom.',
        tip: 'Balanced suits most roles.',
      },
      {
        id: 'screening-copy',
        title: 'Copy a setup',
        body: 'Reuse the screening from another job so you don’t set it up twice.',
      },
      {
        id: 'skills-test-score',
        title: 'Skills test score',
        body: 'Every candidate takes one general skills test when they sign up. This is the lowest score they need to apply. They don’t retake it for your job.',
        tip: '50 lets most people through. 70 or higher keeps only strong candidates.',
      },
      {
        id: 'cv-match',
        title: 'CV match',
        body: 'AI scores how well each CV fits your job, from 0 to 100%. Applicants below your minimum are filtered out. Only you see the score.',
        tip: '60–75% is a sensible bar. Set it too high and you may miss good people whose CVs are written differently.',
      },
      {
        id: 'tailored-questions',
        title: 'Tailored questions',
        body: 'AI writes a few written questions for each applicant, based on your job and their CV, and marks the answers.',
        tip: '4–8 questions works well. More than that and people may give up halfway.',
      },
      {
        id: 'company-tests',
        title: 'Problem-solving and culture-fit tests',
        body: "Short written tests on the job's page. Problem-solving questions check how someone reasons; culture-fit questions are based on your company values. AI marks each answer and only you see the scores, in the candidate panel.",
        tip: 'Generate the questions for the job after you switch a test on. You choose 1–10 questions per test.',
      },
      {
        id: 'personality-check',
        title: 'Personality check',
        body: 'Everyday workplace questions that show how someone likes to work: team energy, detail vs big picture, how they decide, and planning style. Candidates see situations, never labels.',
        tip: 'Use this when team fit matters. There are no right or wrong answers.',
      },
      {
        id: 'own-questions',
        title: 'Your own questions',
        body: 'Questions you write yourself, asked alongside the personality check.',
      },
      {
        id: 'notes-for-ai',
        title: 'Notes for the AI',
        body: 'Private notes on what a great hire looks like: must-have skills, warning signs, experience level. AI uses them to write and mark tailored questions. Candidates never see them.',
      },
      {
        id: 'setup-name',
        title: 'Setup name',
        body: 'A label so your team can tell setups apart. Only your team sees it.',
      },
    ],
  },
  {
    id: 'publishing',
    title: 'Publishing and job status',
    intro: 'What each job status means.',
    entries: [
      {
        id: 'status-draft',
        title: 'Draft',
        body: 'Saved but not visible to talents. A job needs a screening setup before it can go live.',
      },
      {
        id: 'status-pending-payment',
        title: 'Awaiting payment',
        body: 'Your plan needs a one-time payment to publish this job. Pay from the Review step or from My Job Posts.',
      },
      {
        id: 'status-active',
        title: 'Active',
        body: 'Live. Talents can find it and apply.',
      },
      {
        id: 'status-closed',
        title: 'Closed',
        body: 'No longer taking applications. You can still review everyone who applied.',
      },
    ],
  },
]

export const GUIDE_PATH = '/recruiterDashboard/guide'

export const guideLink = (entryId: string) => `${GUIDE_PATH}#${entryId}`

export const filterGuide = (query: string): GuideSection[] => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return GUIDE_SECTIONS
  return GUIDE_SECTIONS.map((section) => ({
    ...section,
    entries: section.entries.filter((entry) => {
      const haystack = `${section.title} ${entry.title} ${entry.body} ${
        entry.tip ?? ''
      }`.toLowerCase()
      return words.every((word) => haystack.includes(word))
    }),
  })).filter((section) => section.entries.length > 0)
}
