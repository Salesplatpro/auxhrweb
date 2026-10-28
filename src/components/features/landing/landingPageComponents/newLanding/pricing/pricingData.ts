import { PricingCatalog } from '@/features/pricing/types'

export type Audience = 'recruiter' | 'talent'

export const pricingHero = {
  eyebrow: 'Pricing',
  title: 'Simple pricing that grows with your hiring',
  subtitle:
    'Free for talent, always. Recruiters pick the plan that fits how they hire and upgrade when the team needs more listings, seats and AI screening.',
}

export const talentPlan = {
  name: 'Talent',
  description: 'For job seekers building their career on AuxHR.',
  price: 'Free',
  caption: 'No card required, ever',
  cta: 'Create free profile',
  features: [
    'Create your talent profile',
    'Browse and apply to jobs',
    'Track every application',
    'Get discovered by recruiters',
  ],
}

export type ComparisonRow = { key: string; label: string }
export type ComparisonSection = { title: string; rows: ComparisonRow[] }

export const comparisonSections: ComparisonSection[] = [
  {
    title: 'Hiring',
    rows: [
      { key: 'job_listings', label: 'Active job listings' },
      { key: 'team_members', label: 'Team members' },
    ],
  },
  {
    title: 'AI & sourcing',
    rows: [
      { key: 'candidate_views', label: 'Candidate profile views / month' },
      { key: 'scout_cv_scans', label: 'AI CV scans / month' },
      { key: 'talent_searches', label: 'AI talent searches / month' },
      { key: 'direct_outreach', label: 'Direct candidate messages / month' },
    ],
  },
  {
    title: 'Tools & support',
    rows: [
      {
        key: 'bulk_broadcast_tools',
        label: 'Bulk pipeline actions & broadcast messaging',
      },
      { key: 'job_board_distribution', label: 'Job board distribution' },
      { key: 'dedicated_support', label: 'Dedicated account support' },
      { key: 'hr_assistant', label: 'Dedicated HR Assistant' },
    ],
  },
]

export type PricingFaqItem = { question: string; answer: string }

export const pricingFaqs = (catalog: PricingCatalog): PricingFaqItem[] => [
  {
    question: 'Is there a free trial?',
    answer: `Yes. SME Basic starts with a 7-day free trial, and every subscription comes with a ${catalog.guarantee.toLowerCase()}.`,
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Monthly plans have no long-term commitment, so you can cancel whenever your hiring slows down.',
  },
  {
    question: 'Which payment methods do you accept?',
    answer:
      'Checkout runs securely through Paystack. Plans are billed in Naira (NGN); USD prices are shown for reference.',
  },
  {
    question: 'What counts as an active job listing?',
    answer:
      'Any job post that is live and accepting applications. Close a role and the slot frees up for a new one.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Anytime. Pick a new plan from the Plan page in your recruiter dashboard whenever your team needs more.',
  },
  {
    question: 'Is AuxHR really free for talent?',
    answer:
      'Always. Talents never pay to create a profile, apply to jobs or track applications.',
  },
]
