import {
  HiOutlineAdjustmentsVertical,
  HiOutlineLockClosed,
  HiOutlineUser,
} from 'react-icons/hi2'

import { LegalContent } from './types'

const COMPANY = '[Company legal name]'
const PRIVACY_EMAIL = '[privacy@auxhr.com]'

export const privacyContent: LegalContent = {
  eyebrow: 'Legal',
  title: 'Privacy Policy',
  meta: 'Last updated: [Month DD, 2026] · Effective: [Month DD, 2026]',
  intro:
    'AuxHR helps talents get hired and businesses hire with confidence. This policy explains what we collect from talents and recruiters, how our AI screening and matching use it, and the choices you have. AuxHR is currently in beta.',
  highlights: [
    {
      icon: HiOutlineLockClosed,
      title: 'We never sell your data',
      body: 'Your profile is only shared with the hiring teams you apply to or choose to be visible to.',
    },
    {
      icon: HiOutlineUser,
      title: 'AI assists, people decide',
      body: 'Matching and screening results are reviewed by a person before any hiring decision is made.',
    },
    {
      icon: HiOutlineAdjustmentsVertical,
      title: "You're in control",
      body: 'Access, correct, export or delete your data anytime from your account settings.',
    },
  ],
  sections: [
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      blocks: [
        {
          type: 'paragraph',
          text: 'We collect information you give us, information created when you use AuxHR, and limited information from services you connect. What we collect depends on whether you join as a recruiter or as talent.',
        },
        { type: 'subheading', text: 'When you create an account' },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Sign-up details:',
              text: 'your name, email address, password and account type (Talent or Recruiter), or your basic Google profile if you sign up with Google.',
            },
            {
              lead: 'Verification and security:',
              text: 'email verification, password recovery and two-factor authentication details.',
            },
          ],
        },
        { type: 'subheading', text: "If you're talent (a candidate)" },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Profile:',
              text: 'name, bio, profile picture, resume or CV, work experience, experience level, skills, certifications and links such as LinkedIn.',
            },
            "Salary expectations, including your preferred currency, and the roles you're looking for.",
            {
              lead: 'Applications:',
              text: 'roles you apply to, answers to pre-screening questions, pre-assessment and personality test results, role-fit and CV match scores, and your application status.',
            },
          ],
        },
        { type: 'subheading', text: "If you're a recruiter or hiring team" },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Organisation profile:',
              text: 'business name, logo, bio, sector and location, plus details of the people on your hiring team.',
            },
            {
              lead: 'Job posts:',
              text: 'job descriptions, requirements, salary ranges, pre-screening questions, score ratings, personality test combinations and CV matching requirements.',
            },
            {
              lead: 'Hiring activity:',
              text: 'candidate filters, shortlists, notes, hiring metrics and reports, and any existing candidate data you import into AuxHR.',
            },
          ],
        },
        { type: 'subheading', text: 'Collected automatically and from others' },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Messages and support:',
              text: 'in-app chats, support tickets, live chat conversations and feedback or NPS survey answers.',
            },
            {
              lead: 'Device and usage data:',
              text: 'IP address, browser, device type (web, Android or iOS), pages viewed, clicks and approximate location.',
            },
            {
              lead: 'Integrations:',
              text: 'information from job platforms and HR tools you connect, such as LinkedIn, Jobberman, Indeed, BambooHR, Zoho or Workable.',
            },
          ],
        },
      ],
    },
    {
      id: 'how-we-use',
      title: 'How we use your information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use your information to run AuxHR and to make hiring faster and fairer for both sides:',
        },
        {
          type: 'bullets',
          items: [
            'Create and verify your account, and guide you through setting up your profile.',
            {
              lead: 'Match talent to roles:',
              text: "our AI compares your profile and CV with each role's requirements and shows a role-fit and CV match score.",
            },
            'Run pre-screening, pre-assessment and personality tests, score them automatically and share results with you straight away.',
            'Help recruiters post jobs, filter and sort applicants, track their hiring pipeline and measure hiring performance on their dashboard.',
            'Send in-app, email and (if you turn them on) push notifications about new applicants and application status changes, based on your notification preferences.',
            'Provide support through live chat, tickets and our knowledge base, and improve AuxHR using your feedback and aggregated usage data.',
          ],
        },
        { type: 'subheading', text: 'AI matching and human review' },
        {
          type: 'paragraph',
          text: "Hiring managers choose the screening questions, weights and pass marks, and AuxHR's scoring applies them to every applicant to filter out applications that don't meet the requirements. Our AI supports decisions; it does not make final hiring decisions. A person on the hiring team reviews candidates before anyone is hired, and you can ask for a human to review any automated result.",
        },
        {
          type: 'paragraph',
          text: 'We do not use your CV, test results or private messages to train general-purpose AI models for other companies. [Confirm model-training policy]',
        },
        {
          type: 'paragraph',
          text: 'Where the GDPR or the NDPA applies, we rely on these legal bases: performing our contract with you, our legitimate interests in running and improving AuxHR, your consent (which you can withdraw at any time), and compliance with the law.',
        },
      ],
    },
    {
      id: 'how-we-share',
      title: 'How we share information',
      blocks: [
        {
          type: 'paragraph',
          text: 'We do not sell your personal information. We only share it in these cases:',
        },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Talent to recruiters:',
              text: 'when you apply to a role, that hiring team sees your profile, CV, salary expectations, test results and match scores. You control your profile visibility in Settings.',
            },
            {
              lead: 'Recruiters to talent:',
              text: 'candidates see the job details, organisation profile and status updates a hiring team publishes, and the messages you send them.',
            },
            'Service providers who process data for us under contract, such as cloud hosting, email delivery, authentication, analytics and customer support tools.',
            'Integrations you turn on, such as job platforms and applicant tracking or HR systems.',
            {
              lead: 'Legal and safety reasons:',
              text: 'when the law requires it, or to protect the rights and safety of our users and the public.',
            },
            {
              lead: 'Business transfers:',
              text: 'as part of a merger, acquisition or sale of assets, with notice to you.',
            },
          ],
        },
      ],
    },
    {
      id: 'data-retention',
      title: 'Data retention',
      blocks: [
        {
          type: 'paragraph',
          text: 'We keep personal information only for as long as we need it for the purposes in this policy.',
        },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Talent profiles and CVs:',
              text: 'while your account is active, and deleted within [30] days after you close it.',
            },
            {
              lead: 'Application records:',
              text: 'kept by the hiring team for up to [24] months after a role closes, unless you ask us to delete them sooner.',
            },
            'Recruiter accounts, job posts and imported candidate data: while the account is active, then deleted or anonymised within [90] days, except records the law requires us to keep.',
            'Support chats, tickets and security logs: up to [12] months.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'We protect your data with encryption in transit and at rest, secure sign-in with email verification and optional two-factor authentication, role-based access controls and regular security reviews. Inside an organisation, candidate data is only visible to the people on that hiring team.',
        },
        {
          type: 'paragraph',
          text: 'No system is 100% secure. If a breach affects your data, we will notify you and the relevant regulators as the law requires.',
        },
      ],
    },
    {
      id: 'your-rights',
      title: 'Your rights',
      blocks: [
        {
          type: 'paragraph',
          text: 'Depending on where you live, including under the EU and UK GDPR and the Nigeria Data Protection Act 2023 (NDPA), you have the right to:',
        },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Access:',
              text: 'get a copy of the personal information we hold about you.',
            },
            {
              lead: 'Correction:',
              text: 'fix information that is inaccurate or incomplete.',
            },
            { lead: 'Deletion:', text: 'ask us to delete your information.' },
            {
              lead: 'Objection and restriction:',
              text: 'object to or limit certain processing, including profiling.',
            },
            {
              lead: 'Human review:',
              text: 'not be subject to a decision based only on automated processing.',
            },
            {
              lead: 'Portability:',
              text: 'receive your data in a machine-readable format.',
            },
            { lead: 'Consent:', text: 'withdraw your consent at any time.' },
          ],
        },
        {
          type: 'paragraph',
          text: `You can update most of your information in Settings. For anything else, email ${PRIVACY_EMAIL} and we will respond within 30 days. You can also complain to your local regulator, such as the Nigeria Data Protection Commission (NDPC) or your EU or UK supervisory authority.`,
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use cookies and similar technologies to keep you signed in, remember your preferences and understand how AuxHR is used.',
        },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Essential cookies:',
              text: "needed for sign-in and security, so they can't be switched off.",
            },
            {
              lead: 'Preference cookies:',
              text: 'remember settings such as language and filters.',
            },
            {
              lead: 'Analytics cookies:',
              text: 'help us improve AuxHR, and are only used with your consent where the law requires it.',
            },
          ],
        },
        {
          type: 'paragraph',
          text: 'You can manage cookies anytime from the cookie banner or your browser settings.',
        },
      ],
    },
    {
      id: 'children',
      title: 'Children',
      blocks: [
        {
          type: 'paragraph',
          text: 'AuxHR is for people aged [18] and over, or the minimum working age where you live. We do not knowingly collect data from children. If you believe a child has given us personal information, contact us and we will delete it.',
        },
      ],
    },
    {
      id: 'international-transfers',
      title: 'International transfers',
      blocks: [
        {
          type: 'paragraph',
          text: "AuxHR serves teams in Nigeria, across Africa and beyond, so your data may be processed in countries other than your own. When we transfer data out of Nigeria, the EU or the UK, we use the safeguards the law requires, such as Standard Contractual Clauses and the NDPA's cross-border transfer rules.",
        },
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update this policy as AuxHR grows. If we make material changes, we will tell you by email or in the app before they take effect, and update the "Last updated" date at the top of this page.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact us',
      blocks: [
        {
          type: 'paragraph',
          text: 'Questions or requests about your privacy? Contact our Data Protection Officer:',
        },
        {
          type: 'bullets',
          items: [
            { lead: 'Company:', text: COMPANY },
            { lead: 'Address:', text: '[Registered address], Lagos, Nigeria' },
            { lead: 'Email:', text: PRIVACY_EMAIL },
            { lead: 'Data Protection Officer:', text: '[DPO name]' },
          ],
        },
      ],
    },
  ],
}
