import React from 'react'
import { Navigate, RouteObject } from 'react-router-dom'

import CustomerStories from '@/components/features/landing/customerStories'
import Explore from '@/components/features/landing/Explore'
import {
  AboutUs,
  Features,
  PrivacyPolicy,
  TermsAndCondition,
  Testimonials,
} from '@/components/features/landing/landingPageComponents'
import Faq from '@/components/features/landing/landingPageComponents/FAQ/Faq'
import Pricing from '@/components/features/landing/Pricing'
import Solutions from '@/components/features/landing/Solutions'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import RequireActiveCompany from '@/components/routing/RequireActiveCompany'
import RequireEmailVerified from '@/components/routing/RequireEmailVerified'
import RequirePeopleAccess from '@/components/routing/RequirePeopleAccess'
import ApplyWizardEntry from '@/features/apply-wizard/ApplyWizardEntry'
import ApplyWizardLayout from '@/features/apply-wizard/ApplyWizardLayout'
import ApplyStep from '@/features/apply-wizard/steps/ApplyStep'
import PrescreeningStep from '@/features/apply-wizard/steps/PrescreeningStep'
import ProfileStep from '@/features/apply-wizard/steps/ProfileStep'
import SignupStep from '@/features/apply-wizard/steps/SignupStep'
import VerifyStep from '@/features/apply-wizard/steps/VerifyStep'
import {
  ChangePasswordPage,
  ForgotPasswordPage,
  JoinCompanyInvitePage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
} from '@/features/auth/pages'
import AccountEmailVerification from '@/features/email-verification/pages/AccountEmailVerification'
import JoinStaffEntry from '@/features/join-staff/JoinStaffEntry'
import JoinStaffLayout from '@/features/join-staff/JoinStaffLayout'
import JoinStaffAccountStep from '@/features/join-staff/steps/AccountStep'
import JoinStaffJoinStep from '@/features/join-staff/steps/JoinStep'
import JoinStaffProfileStep from '@/features/join-staff/steps/ProfileStep'
import JoinStaffVerifyStep from '@/features/join-staff/steps/VerifyStep'
import PreAssessmentPage from '@/features/pre-assessment/page'
import { LandingPage } from '@/LandingPage'
import { MainLayout, Resources } from '@/pages'
import AdminProfileSidebar from '@/pages/AdminProfile/AdminProfileSidebar'
import Applications from '@/pages/AdminProfile/Applications/Applications'
import Feedback from '@/pages/AdminProfile/Feedback/Feedback'
import AdminJobDetail from '@/pages/AdminProfile/JobDetail/AdminJobDetail'
import Jobs from '@/pages/AdminProfile/Jobs/Jobs'
import OrganizationDetail from '@/pages/AdminProfile/Organizations/OrganizationDetail'
import Organizations from '@/pages/AdminProfile/Organizations/Organizations'
import Overview from '@/pages/AdminProfile/Overview/Overview'
import Recruiters from '@/pages/AdminProfile/Recruiters/Recruiters'
import AdminRoles from '@/pages/AdminProfile/Roles/Roles'
import AdminTalentDetail from '@/pages/AdminProfile/Talents/TalentDetail'
import Talents from '@/pages/AdminProfile/Talents/Talents'
import { FeedbackPage } from '@/pages/Feedback'
import PostedJob from '@/pages/Home/Jobs/PostedJob'
import VerifyPaymentPage from '@/pages/Pricing/Verify'
import {
  Chat,
  MyJobPosts,
  Profile as RecruiterProfilePage,
  Shortlist,
} from '@/pages/RecruiterProfile'
import Company from '@/pages/RecruiterProfile/Company/Company'
import CreateCompany from '@/pages/RecruiterProfile/Company/CreateCompany'
import EditCompany from '@/pages/RecruiterProfile/Company/EditCompany'
import AllApplications from '@/pages/RecruiterProfile/Dashboard/AllApplications'
import Dashboard from '@/pages/RecruiterProfile/Dashboard/Dashboard'
import { EditJobTab } from '@/pages/RecruiterProfile/EditJob'
import RecruiterGuide from '@/pages/RecruiterProfile/Guide/Guide'
import JobDetail from '@/pages/RecruiterProfile/JobDetail'
import { SingleJobPost } from '@/pages/RecruiterProfile/MyJobPosts/SingleJobPost'
import { AccessLog } from '@/pages/RecruiterProfile/People/AccessLog'
import { EmployeeDetail } from '@/pages/RecruiterProfile/People/EmployeeDetail'
import { Employees } from '@/pages/RecruiterProfile/People/Employees'
import RecruiterPlanPage from '@/pages/RecruiterProfile/Plan/RecruiterPlanPage'
import PostJobTab from '@/pages/RecruiterProfile/PostJobs/PostJobTab'
import RecruiterProfileSidebar from '@/pages/RecruiterProfile/RecruiterProfileSidebar'
import { CampaignDetail } from '@/pages/RecruiterProfile/Scout/CampaignDetail'
import { CampaignForm } from '@/pages/RecruiterProfile/Scout/CampaignForm'
import { RunResults } from '@/pages/RecruiterProfile/Scout/RunResults'
import { ScoutCampaigns } from '@/pages/RecruiterProfile/Scout/ScoutCampaigns'
import { UploadStep } from '@/pages/RecruiterProfile/Scout/UploadStep'
import { TalentSearch } from '@/pages/RecruiterProfile/TalentSearch/TalentSearch'
import { ApplicationPipeline } from '@/pages/TalentProfile/ApplicationPipeline'
import TalentDashboardHome from '@/pages/TalentProfile/Dashboard/TalentDashboardHome'
import Inbox from '@/pages/TalentProfile/Inbox/InboxList'
import IndividualJob from '@/pages/TalentProfile/Job/IndividualJob'
import Job from '@/pages/TalentProfile/Job/Job'
import {
  RedirectPersonalityToJob,
  RedirectPersonalizedToJob,
  RedirectPipelineToJob,
} from '@/pages/TalentProfile/Job/PipelineRedirects'
import Notifications from '@/pages/TalentProfile/Notifications/NotificationsList'
import TalentProfile from '@/pages/TalentProfile/Profile'
import { Support } from '@/pages/TalentProfile/Support'
import TalentProfileSidebar from '@/pages/TalentProfile/TalentProfileSidebar'
import { paths } from '@/paths'

import { RootLayout } from './RootLayout'
import { RouteErrorPage } from './RouteErrorPage'

export const routeConfig: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          {
            path: '/',
            element: <LandingPage />,
          },
          {
            path: 'explore',
            element: <Explore />,
          },
          {
            path: 'solution',
            element: <Solutions />,
          },
          {
            path: 'features',
            element: <Features />,
          },
          {
            path: 'resources',
            element: <Resources />,
          },
          {
            path: 'customerstories',
            element: <CustomerStories />,
          },
          {
            path: 'pricing',
            element: <Pricing />,
          },
          {
            path: 'about-us',
            element: <AboutUs />,
          },
          {
            path: paths.login,
            element: <LoginPage />,
          },
          {
            path: paths.register,
            element: <SignupPage />,
          },
          {
            path: 'join-company/:token',
            element: <JoinCompanyInvitePage />,
          },
          {
            path: paths.forgotPassword,
            element: <ForgotPasswordPage />,
          },
          {
            path: paths.resetPassword,
            element: <ResetPasswordPage />,
          },
          {
            path: 'faq',
            element: <Faq />,
          },
          {
            path: 'testimonials',
            element: <Testimonials />,
          },
          {
            path: 'job/postedjob/:jobId',
            element: <PostedJob />,
          },
          {
            path: paths.privacyPolicy,
            element: <PrivacyPolicy />,
          },
          {
            path: paths.termsConditions,
            element: <TermsAndCondition />,
          },
        ],
      },
      {
        path: '/payment/verify',
        element: <VerifyPaymentPage />,
      },
      {
        path: `/${paths.verifyEmail}`,
        element: <AccountEmailVerification />,
      },
      {
        path: '/join-staff/:token',
        element: <JoinStaffLayout />,
        children: [
          { index: true, element: <JoinStaffEntry /> },
          { path: 'account', element: <JoinStaffAccountStep /> },
          {
            element: <ProtectedRoute allowedRoles={['talent']} />,
            children: [
              { path: 'verify', element: <JoinStaffVerifyStep /> },
              { path: 'profile', element: <JoinStaffProfileStep /> },
              { path: 'join', element: <JoinStaffJoinStep /> },
            ],
          },
        ],
      },
      {
        path: '/apply/:jobId',
        element: <ApplyWizardLayout />,
        children: [
          {
            index: true,
            element: <ApplyWizardEntry />,
          },
          {
            path: 'signup',
            element: <SignupStep />,
          },
          {
            element: <ProtectedRoute allowedRoles={['talent']} />,
            children: [
              {
                path: 'verify',
                element: <VerifyStep />,
              },
              {
                path: 'profile',
                element: <ProfileStep />,
              },
              {
                path: 'prescreen',
                element: <PrescreeningStep />,
              },
              {
                path: 'details',
                element: <ApplyStep />,
              },
            ],
          },
        ],
      },
      {
        path: '/talentDashboard',
        element: <ProtectedRoute allowedRoles={['talent']} />,
        children: [
          {
            path: '',
            element: <TalentProfileSidebar />,
            children: [
              {
                index: true,
                element: <TalentDashboardHome />,
              },
              {
                path: paths.changePassword,
                element: <ChangePasswordPage />,
              },
              {
                path: 'feedback',
                element: <FeedbackPage />,
              },
              {
                element: <RequireEmailVerified redirectTo="/talentDashboard" />,
                children: [
                  {
                    path: 'talentProfile',
                    element: <TalentProfile />,
                  },
                  {
                    path: 'talentQuiz',
                    element: <PreAssessmentPage />,
                  },
                  {
                    path: 'job',
                    element: <Job />,
                  },
                  {
                    path: '/talentDashboard/support',
                    element: <Support />,
                  },
                  {
                    path: 'chat',
                    element: <Inbox />,
                  },
                  {
                    path: 'Chat',
                    element: <Navigate to="/talentDashboard/chat" replace />,
                  },
                  {
                    path: 'notification',
                    element: <Notifications />,
                  },
                  {
                    path: 'Notification',
                    element: (
                      <Navigate to="/talentDashboard/notification" replace />
                    ),
                  },
                  {
                    path: 'job/:jobId',
                    element: <IndividualJob />,
                  },
                  {
                    path: 'applicationPipeline',
                    element: <ApplicationPipeline />,
                  },
                  {
                    path: 'applicationPipeline/personalizedTest/:jobId/:talentId',
                    element: <RedirectPersonalizedToJob />,
                  },
                  {
                    path: 'applicationPipeline/:jobId',
                    element: <RedirectPipelineToJob />,
                  },
                  {
                    path: 'applicationPipeline/personalityTest/:jobId',
                    element: <RedirectPersonalityToJob />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/recruiterDashboard',
        element: <ProtectedRoute allowedRoles={['recruiter']} />,
        children: [
          {
            path: '',
            element: <RecruiterProfileSidebar />,
            children: [
              {
                index: true,
                element: <Navigate to="dashboard" replace />,
              },
              {
                path: 'dashboard',
                element: <Dashboard />,
              },
              {
                path: 'feedback',
                element: <FeedbackPage />,
              },
              {
                path: 'guide',
                element: <RecruiterGuide />,
              },
              {
                path: paths.changePassword,
                element: <ChangePasswordPage />,
              },
              {
                path: 'verify-email',
                element: (
                  <Navigate to="/recruiterDashboard/dashboard" replace />
                ),
              },
              {
                element: (
                  <RequireEmailVerified redirectTo="/recruiterDashboard/dashboard" />
                ),
                children: [
                  {
                    path: 'company',
                    element: <Company />,
                  },
                  {
                    path: 'company/new',
                    element: <CreateCompany />,
                  },
                  {
                    path: 'company/:id/edit',
                    element: <EditCompany />,
                  },
                  {
                    element: <RequireActiveCompany />,
                    children: [
                      {
                        path: 'dashboard/allapplications',
                        element: <AllApplications />,
                      },
                      {
                        path: 'postjob',
                        element: <PostJobTab />,
                      },
                      {
                        path: 'postjob/:jobId',
                        element: <PostJobTab step="screening" />,
                      },
                      {
                        path: 'postjob/:jobId/details',
                        element: <PostJobTab step="details" />,
                      },
                      {
                        path: 'postjob/:jobId/review',
                        element: <PostJobTab step="review" />,
                      },
                      {
                        path: 'myJobPosts',
                        element: <MyJobPosts />,
                      },
                      {
                        path: 'scout',
                        children: [
                          { index: true, element: <ScoutCampaigns /> },
                          { path: 'new', element: <CampaignForm /> },
                          {
                            path: ':campaignId',
                            element: <CampaignDetail />,
                          },
                          {
                            path: ':campaignId/edit',
                            element: <CampaignForm />,
                          },
                          {
                            path: ':campaignId/upload',
                            element: <UploadStep />,
                          },
                          {
                            path: ':campaignId/runs/:runId',
                            element: <RunResults />,
                          },
                        ],
                      },
                      {
                        path: 'talent-search',
                        element: <TalentSearch />,
                      },
                      {
                        path: 'singleJobPost/:jobId',
                        element: <SingleJobPost />,
                      },
                      {
                        path: 'editJob/:jobId',
                        element: <EditJobTab />,
                      },
                      {
                        path: 'jobdetail/:jobId',
                        element: <JobDetail />,
                      },
                      {
                        path: 'shortlist',
                        element: <Shortlist />,
                      },
                      {
                        path: 'chat',
                        element: <Chat />,
                      },
                      {
                        path: 'people',
                        element: <RequirePeopleAccess />,
                        children: [
                          {
                            index: true,
                            element: <Navigate to="employees" replace />,
                          },
                          { path: 'employees', element: <Employees /> },
                          {
                            path: 'employees/:staffId',
                            element: <EmployeeDetail />,
                          },
                          {
                            element: <RequirePeopleAccess ownerOnly />,
                            children: [
                              { path: 'access-log', element: <AccessLog /> },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    path: 'profile',
                    element: <RecruiterProfilePage />,
                  },
                  {
                    path: 'plan',
                    element: <RecruiterPlanPage />,
                  },
                  {
                    path: 'notifications',
                    element: <Notifications />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/adminDashboard',
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            path: '',
            element: <AdminProfileSidebar />,
            children: [
              {
                index: true,
                element: <Overview />,
              },
              {
                path: 'talents',
                element: <Talents />,
              },
              {
                path: 'recruiters',
                element: <Recruiters />,
              },
              {
                path: 'organizations',
                element: <Organizations />,
              },
              {
                path: 'organizations/:organizationId',
                element: <OrganizationDetail />,
              },
              {
                path: 'jobs',
                element: <Jobs />,
              },
              {
                path: 'jobs/:jobId',
                element: <AdminJobDetail />,
              },
              {
                path: 'talents/:talentId',
                element: <AdminTalentDetail />,
              },
              {
                path: 'applications',
                element: <Applications />,
              },
              {
                path: 'roles',
                element: <AdminRoles />,
              },
              {
                path: 'feedback',
                element: <Feedback />,
              },
              {
                path: 'leave-feedback',
                element: <FeedbackPage />,
              },
              {
                path: 'notifications',
                element: <Notifications />,
              },
            ],
          },
        ],
      },
    ],
  },
]
