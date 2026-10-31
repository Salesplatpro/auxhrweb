import {
  HiOutlineCreditCard,
  HiOutlineSparkles,
  HiOutlineUsers,
} from 'react-icons/hi2'

import { LegalContent } from './types'

const COMPANY = '[Company legal name]'
const SUPPORT_EMAIL = '[support@auxhr.com]'

export const termsContent: LegalContent = {
  eyebrow: 'Legal',
  title: 'Terms & Conditions',
  meta: 'Last updated: [Month DD, 2026] · Effective: [Month DD, 2026]',
  intro: `These terms are the agreement between you and ${COMPANY} ("AuxHR", "we", "us") for using AuxHR, whether you're a recruiter hiring for your team or talent looking for your next role. Please read them carefully. AuxHR is currently in beta.`,
  highlights: [
    {
      icon: HiOutlineUsers,
      title: 'One agreement, both sides',
      body: 'These terms cover recruiters and hiring teams as well as talent using AuxHR to find work.',
    },
    {
      icon: HiOutlineCreditCard,
      title: 'Clear billing',
      body: 'Paid plans renew automatically. Cancel anytime before your next billing date to stop renewal.',
    },
    {
      icon: HiOutlineSparkles,
      title: 'AI helps, you decide',
      body: 'Match scores and screening results are guidance, not hiring decisions or job guarantees.',
    },
  ],
  sections: [
    {
      id: 'acceptance',
      title: 'Acceptance of these terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'By creating an account, clicking "I agree", or using AuxHR on the web, Android or iOS, you agree to these Terms & Conditions and to our Privacy Policy. If you use AuxHR on behalf of a company, you confirm you have authority to bind that company, and "you" includes it.',
        },
        {
          type: 'paragraph',
          text: 'If you do not agree, please do not use AuxHR. During the beta, some features may change, be limited to selected users, or be removed.',
        },
      ],
    },
    {
      id: 'accounts',
      title: 'Accounts and eligibility',
      blocks: [
        {
          type: 'bullets',
          items: [
            'You must be at least [18] years old, or the minimum working age where you live, to use AuxHR.',
            'Give accurate, current information when you sign up with email or Google, and keep your profile up to date.',
            'Keep your password and two-factor authentication details secure. You are responsible for activity on your account.',
            'One person, one talent account. Recruiter accounts may add team members, who must each accept these terms.',
            `Tell us right away at ${SUPPORT_EMAIL} if you think your account has been accessed without permission.`,
          ],
        },
      ],
    },
    {
      id: 'recruiter-talent-use',
      title: 'Recruiter and talent use',
      blocks: [
        { type: 'subheading', text: "If you're a recruiter or hiring team" },
        {
          type: 'bullets',
          items: [
            'Post only real, lawful vacancies that you are authorised to fill, with honest job descriptions, requirements and salary ranges.',
            'Use candidate data only to assess candidates for your roles, and never sell it or use it for unrelated marketing.',
            'Make hiring decisions in line with employment and anti-discrimination laws. You remain the employer of anyone you hire.',
            'Pre-screening questions, score ratings, personality tests and CV matching requirements you configure are your responsibility.',
          ],
        },
        { type: 'subheading', text: "If you're talent" },
        {
          type: 'bullets',
          items: [
            'Your profile, CV, experience, skills and certifications must be truthful and your own.',
            'Complete pre-assessment and personality tests yourself, without outside help unless a test allows it.',
            'AuxHR does not employ you and does not guarantee interviews, offers or a particular salary.',
          ],
        },
      ],
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions, payments and refunds',
      blocks: [
        {
          type: 'paragraph',
          text: "Talent can use AuxHR's core job search features for free. Recruiters can choose a free plan or a paid plan with more job posts, seats and AI screening.",
        },
        {
          type: 'bullets',
          items: [
            {
              lead: 'Fees:',
              text: 'plans cost [₦/$ amount] per [month/year] as shown on our pricing page at checkout, plus any applicable taxes.',
            },
            {
              lead: 'Billing:',
              text: 'paid plans are charged in advance through our payment partner [Payment provider] and renew automatically until cancelled.',
            },
            {
              lead: 'Cancellation:',
              text: 'cancel anytime in Settings → Billing. You keep access until the end of the current billing period.',
            },
            {
              lead: 'Refunds:',
              text: 'fees are non-refundable except where the law requires, or as stated in [refund window, e.g. 14 days] for annual plans.',
            },
            {
              lead: 'Price changes:',
              text: "we will give at least [30] days' notice before a new price applies to your plan.",
            },
          ],
        },
      ],
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      blocks: [
        { type: 'paragraph', text: 'You agree not to:' },
        {
          type: 'bullets',
          items: [
            'Post fake jobs, scams, pyramid schemes, or roles that ask candidates to pay to apply.',
            'Harass, discriminate against or mislead other users, in chats or anywhere else on AuxHR.',
            'Scrape, copy or bulk-download profiles or job posts, or use bots without our written permission.',
            'Upload malware, try to break our security, or reverse engineer the platform.',
            'Use AuxHR in a way that breaks any law, including data protection and employment laws.',
          ],
        },
      ],
    },
    {
      id: 'ai-features',
      title: 'AI features and matching',
      blocks: [
        {
          type: 'paragraph',
          text: 'AuxHR uses AI to configure screening, score pre-assessments, rate role fit and match CVs to job requirements. These tools are there to save time, not to replace human judgement.',
        },
        {
          type: 'bullets',
          items: [
            'Scores, rankings and recommendations are estimates based on the information provided and may be incomplete or wrong.',
            'Recruiters must review results before rejecting or hiring anyone, and must not rely on AI output alone.',
            'We do not guarantee that a match leads to an interview, an offer or a successful hire.',
            'Talent can ask a recruiter to review an application that was screened out automatically.',
          ],
        },
      ],
    },
    {
      id: 'content-ip',
      title: 'Your content and intellectual property',
      blocks: [
        {
          type: 'paragraph',
          text: 'You own the content you upload, such as CVs, profiles, job posts, logos and messages. You give AuxHR a worldwide, non-exclusive, royalty-free licence to host, process and display it only to run and improve the service.',
        },
        {
          type: 'paragraph',
          text: `AuxHR, its logo, designs, software and AI models belong to ${COMPANY} and its licensors. You may not copy, modify or resell any part of the platform without our written permission.`,
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Third-party integrations',
      blocks: [
        {
          type: 'paragraph',
          text: 'You can connect AuxHR to services such as LinkedIn, Jobberman, Indeed, BambooHR, Zoho and Workable. Those services are run by other companies under their own terms and privacy policies. We are not responsible for their availability, accuracy or how they handle your data, and an integration may stop working if the provider changes its service.',
        },
      ],
    },
    {
      id: 'termination',
      title: 'Suspension and termination',
      blocks: [
        {
          type: 'bullets',
          items: [
            `You can close your account anytime in Settings or by contacting ${SUPPORT_EMAIL}.`,
            'We may suspend or close accounts that break these terms, put other users at risk, or remain unpaid, with notice where reasonable.',
            'When an account closes, job posts are taken down and data is handled as set out in our Privacy Policy.',
            'Sections on fees owed, intellectual property, disclaimers, liability and governing law continue after termination.',
          ],
        },
      ],
    },
    {
      id: 'liability',
      title: 'Disclaimers and limitation of liability',
      blocks: [
        {
          type: 'paragraph',
          text: 'AuxHR is provided "as is" and "as available", especially during the beta. We do not promise it will be uninterrupted or error-free, or that any user, job or candidate is who or what they say.',
        },
        {
          type: 'paragraph',
          text: 'To the extent the law allows, AuxHR is not liable for indirect or consequential losses, such as lost profits, lost data or a lost hiring opportunity. Our total liability for any claim is limited to the greater of the fees you paid us in the [12] months before the claim or [₦/$ amount]. Nothing here limits liability that cannot be limited by law.',
        },
      ],
    },
    {
      id: 'governing-law',
      title: 'Governing law and disputes',
      blocks: [
        {
          type: 'paragraph',
          text: 'These terms are governed by the laws of the Federal Republic of Nigeria. We will first try to resolve any dispute informally by email. If that fails within [30] days, disputes will be settled by [arbitration in Lagos under the Arbitration and Mediation Act 2023 / the courts of Lagos State], unless the law where you live gives you other rights.',
        },
      ],
    },
    {
      id: 'changes',
      title: 'Changes to these terms',
      blocks: [
        {
          type: 'paragraph',
          text: 'We may update these terms as AuxHR grows. For material changes we will notify you by email or in the app at least [14] days before they take effect. If you keep using AuxHR after that, you accept the updated terms.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Contact us',
      blocks: [
        {
          type: 'paragraph',
          text: 'Questions about these terms? Get in touch:',
        },
        {
          type: 'bullets',
          items: [
            { lead: 'Company:', text: COMPANY },
            { lead: 'Address:', text: '[Registered address], Lagos, Nigeria' },
            { lead: 'Email:', text: '[legal@auxhr.com]' },
            { lead: 'Support:', text: SUPPORT_EMAIL },
          ],
        },
      ],
    },
  ],
}
