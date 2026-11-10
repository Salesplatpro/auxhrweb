import badgeCheckSmall from './assets/badge-check-small.svg'
import botHiring from './assets/bot-hiring.svg'
import search from './assets/search.svg'

type SearchMock = {
  kind: 'search'
  icon: string
  placeholder: string
}

type PillMock = {
  kind: 'pill'
  icon: string
  text: string
}

type SkeletonTableMock = {
  kind: 'skeletonTable'
  // Each inner array is one column's row bar widths, as a percent of the column.
  columns: number[][]
}

type ProfileMock = {
  kind: 'profile'
  badgeIcon: string
  name: string
  role: string
  fitLabel: string
}

type ChoicesMock = {
  kind: 'choices'
  control: 'toggle' | 'radio'
  items: { label: string; on: boolean }[]
}

type CompareMock = {
  kind: 'compare'
  score: string
  left: { title: string; text: string }
  right: { title: string; text: string }
}

type BarsMock = {
  kind: 'bars'
  heights: number[]
}

type ChartMock = {
  kind: 'chart'
  stats: { value: string; label: string }[]
  heights: number[]
}

type ChatMock = {
  kind: 'chat'
  messages: { text: string; mine: boolean }[]
}

export type StepCard =
  | SearchMock
  | PillMock
  | SkeletonTableMock
  | ProfileMock
  | ChoicesMock
  | CompareMock
  | BarsMock
  | ChartMock
  | ChatMock

export type HowItWorksStep = {
  id: string
  number: string
  title: string
  description: string
  card: StepCard
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 'create-role',
    number: '01',
    title: 'Create your role',
    description:
      "Tell AuxHR what you're looking for with custom weights, culture factors, and technical benchmarks.",
    card: {
      kind: 'search',
      icon: search,
      placeholder: 'I am hiring for a...',
    },
  },
  {
    id: 'ai-find-fit',
    number: '02',
    title: 'Let AI find the fit',
    description:
      'AuxHR analyzes candidate pools across inbound pipelines and passive networks to surface precision matches.',
    card: {
      kind: 'pill',
      icon: botHiring,
      text: 'Found 200 candidates...',
    },
  },
  {
    id: 'review-matches',
    number: '03',
    title: 'Review your matches',
    description:
      'Explore profiles, comprehensive reasoning briefs, objective pros/cons, and customized interview question guides.',
    card: {
      kind: 'skeletonTable',
      columns: [
        [62, 35, 49, 41, 36],
        [49, 14, 12, 13, 12],
        [24, 14, 16, 17, 19],
        [58, 50, 45, 49, 51],
      ],
    },
  },
  {
    id: 'make-move',
    number: '04',
    title: 'Make your move',
    description:
      'Shortlist top choices, synchronize panel interviews, track sentiment, and roll out competitive offers.',
    card: {
      kind: 'profile',
      badgeIcon: badgeCheckSmall,
      name: 'Johnson Kelvin',
      role: 'Product Designer',
      fitLabel: '98% fit',
    },
  },
]
