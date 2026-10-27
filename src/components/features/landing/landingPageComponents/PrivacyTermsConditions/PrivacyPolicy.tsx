import React from 'react'

import { Text } from '@/components/ui/Typography'

import styles from './PrivacyPolicy.module.scss'

type PolicyItemProps = {
  title: string
  children: React.ReactNode
}

const PolicyItem = ({ title, children }: PolicyItemProps) => (
  <div className={styles.policyItem}>
    <Text size="fs-2xl" weight="bold">
      {title}
    </Text>
    <Text color="primary">{children}</Text>
  </div>
)

export const PrivacyPolicy = () => {
  return (
    <div>
      <div className={styles.topContent}>
        <Text size="fs-4xl" color="white" weight="bold">
          Privacy Policy
        </Text>
        <Text
          size="fs-xl"
          color="white"
          weight="normal"
          className={styles.text}>
          Your privacy is important to us at Untitled. We respect your privacy
          regarding any information we may collect from you across our website.
        </Text>
      </div>

      <div className={styles.content}>
        <Text size="fs-lg" color="primary" className={styles.policy}>
          This Privacy Policy explains how AUXHR collects, uses, and shares
          information linked to an identified or identifiable individual
          (referred to in this Privacy Policy as “Personal Data”). It also
          outlines the options available to you regarding the use of your
          information. If you have any questions, you are encouraged to reach
          out to us. When we mention “AUXHR,” we are referring to AUXHR
          Technologies and its affiliates, as described further in the
          “Identifying the Data Controller and Processor” section below.
        </Text>

        <PolicyItem title="What information do we collect?">
          We collect different types of information to provide seamless HR and
          recruitment solutions for organizations and talents:
          <br />
          <br />
          - Personal Information: Name, email address, phone number, job title,
          professional history, resume/CV text extracted from uploads, and login
          credentials. Original CV files are not retained in object storage;
          recruiters view a generated PDF derived from the extracted text.
          <br />
          - Organizational Data: Company name, role, workforce details,
          subscription plans, and HR-related information provided by employers.
          <br />
          - Financial Information: Billing details such as card information or
          invoicing data, processed securely via trusted payment gateways.
          <br />
          - Technical & Usage Data: IP addresses, device identifiers, browser
          types, operating systems, and usage patterns on our platform.
          <br />- Communication Data: Feedback, support queries, emails, and
          interactions through our customer support channels.
        </PolicyItem>
        <PolicyItem title="How do we use your information?">
          AuxHR processes the information collected for the following purposes:
          <br />
          - To deliver, operate, and maintain our HR technology platform.
          <br />
          - To facilitate recruitment, employee onboarding, and organizational
          HR needs.
          <br />
          - To personalize the user experience and improve service delivery.
          <br />
          - To communicate updates, promotional offers, and important notices.
          <br />
          - To conduct analytics and research that enhance the effectiveness of
          our services.
          <br />- To comply with regulatory, contractual, and security
          requirements.
        </PolicyItem>
        <PolicyItem title="Do we use cookies and other tracking technologies?">
          Yes. AuxHR uses cookies, beacons, and similar tracking tools to:
          <br />
          - Remember user preferences and login sessions.
          <br />
          - Improve website performance and navigation.
          <br />
          - Analyze usage behavior for service enhancement.
          <br />
          - Deliver targeted advertisements (where applicable).
          <br />
          <br />
          Users can disable cookies in their browsers, but doing so may affect
          some features of the platform.
        </PolicyItem>
        <PolicyItem title="How long do we keep your information?">
          We only retain your information for as long as it is necessary to
          fulfill the purposes outlined in this policy, or as required by law.
          Once retention is no longer required, we securely delete or anonymize
          your data.
        </PolicyItem>
        <PolicyItem title="How do we keep your information safe?">
          AuxHR employs industry-standard security measures to protect your
          data, including:
          <br />
          - Data encryption during transmission and storage.
          <br />
          - Role-based access controls for sensitive information.
          <br />
          - Regular monitoring and security updates to prevent unauthorized
          access.
          <br />
          - Vendor and partner compliance with strict data protection standards.
          <br />
          <br />
          Despite our safeguards, no method of transmission over the Internet is
          completely secure. We encourage users to take precautions, such as
          safeguarding login credentials.
        </PolicyItem>
        <PolicyItem title="What are your privacy rights?">
          Depending on your jurisdiction, you may have the following rights:
          <br />
          - Access and Correction: You can request to view and update your
          information.
          <br />
          - Data Portability: You can request a copy of your data in a portable
          format.
          <br />
          - Erasure: You can request deletion of your personal data, subject to
          legal and contractual obligations.
          <br />
          - Restriction of Processing: You can request limits on how your data
          is used.
          <br />
          - Opt-Out: You may opt-out of marketing communications at any time.
          <br />
          <br />
          Requests can be sent to privacy@auxhr.com.
        </PolicyItem>
        <PolicyItem title="Sharing Of Information">
          We may share your information with:
          <br />
          - Service Providers: Third-party vendors who assist in providing our
          services (e.g., payment processors, cloud hosting).
          <br />
          - Employers/Organizations: If you are a job seeker, your information
          may be shared with prospective employers.
          <br />
          - Legal Authorities: When required by law, court order, or government
          regulations.
          <br />
          <br />
          AuxHR will never sell your personal data to third parties.
        </PolicyItem>
        <PolicyItem title="International Data Transfers">
          If you access AuxHR from outside Nigeria, your information may be
          transferred and stored in jurisdictions with different data protection
          laws. We ensure adequate safeguards are in place for such transfers.
        </PolicyItem>
        <PolicyItem title="Updates To Policy">
          We may update this Privacy Policy periodically. The updated version
          will be posted on our website with a new effective date. Continued use
          of AuxHR after updates constitutes acceptance of the revised policy.
        </PolicyItem>
        <PolicyItem title="Contact Us">
          If you have questions, concerns, or requests regarding this Privacy
          Policy,
          <br />
          please contact:
          <br />
          privacy@auxhr.com
          <br />
          <a href="https://auxhr.com" target="_blank" rel="noreferrer">
            www.auxhr.com
          </a>
        </PolicyItem>
      </div>
    </div>
  )
}
