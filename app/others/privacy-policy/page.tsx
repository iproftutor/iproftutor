import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 leading-relaxed mb-8">
            <strong>Effective Date:</strong>{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              iProf Tutor Inc. ("we," "us," or "our") is committed to protecting
              the privacy of our users. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our educational platform and services.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We take the privacy of students seriously and comply with
              applicable privacy laws, including COPPA, FERPA, GDPR, and CCPA.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Personal Information
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may collect the following types of personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address,
                username, password
              </li>
              <li>
                <strong>Student Information:</strong> Grade level, school name,
                learning preferences
              </li>
              <li>
                <strong>Parent/Guardian Information:</strong> Contact details,
                relationship to student
              </li>
              <li>
                <strong>Teacher Information:</strong> School affiliation,
                subject areas, class information
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details, payment
                method (processed securely by third-party providers)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Usage Information
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                Learning activity data, progress reports, assessment results
              </li>
              <li>Device information, IP address, browser type</li>
              <li>Usage patterns, features accessed, time spent on platform</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Provide Services:</strong> Deliver personalized learning
                experiences, track progress, generate reports
              </li>
              <li>
                <strong>Improve Platform:</strong> Analyze usage patterns,
                develop new features, enhance user experience
              </li>
              <li>
                <strong>Communication:</strong> Send updates, notifications,
                educational content, and support messages
              </li>
              <li>
                <strong>Safety & Security:</strong> Protect against fraud,
                ensure platform security, enforce our terms
              </li>
              <li>
                <strong>Legal Compliance:</strong> Meet regulatory requirements,
                respond to legal requests
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Data Sharing and Disclosure
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not sell student personal information. We may share
              information with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Educational Institutions:</strong> With schools or
                districts that use our platform (with appropriate consent)
              </li>
              <li>
                <strong>Service Providers:</strong> Third-party vendors who
                assist in platform operations (under strict confidentiality
                agreements)
              </li>
              <li>
                <strong>Parents/Guardians:</strong> Progress reports and
                learning data for their children
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect rights and safety
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Children's Privacy (COPPA Compliance)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For users under 13 years of age:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                We require verifiable parental consent before collecting
                personal information
              </li>
              <li>
                Parents can review, update, or delete their child's information
                at any time
              </li>
              <li>
                We collect only information necessary for educational purposes
              </li>
              <li>
                We do not enable public profiles or direct messaging for
                children under 13
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Student Data Protection (FERPA Compliance)
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For educational records covered by FERPA:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                We act as a school official with legitimate educational interest
              </li>
              <li>
                Student data is used solely for authorized educational purposes
              </li>
              <li>
                We maintain appropriate security safeguards for educational
                records
              </li>
              <li>
                We do not re-disclose personally identifiable information
                without consent
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Data Security
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your
              information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection practices</li>
              <li>Incident response procedures for data breaches</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Rights and Choices
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal
                information
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                information (subject to legal obligations)
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing
                communications
              </li>
              <li>
                <strong>Data Portability:</strong> Receive your data in a
                structured, machine-readable format
              </li>
              <li>
                <strong>Restrict Processing:</strong> Limit how we use your
                information
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              To exercise these rights, contact us at privacy@iproftutor.com.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use cookies and similar technologies to enhance user
              experience, analyze usage, and provide personalized content. You
              can manage cookie preferences through your browser settings. Note
              that disabling cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              International Data Transfers
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries
              other than your country of residence. We ensure appropriate
              safeguards are in place to protect your information in accordance
              with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Data Retention
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We retain personal information for as long as necessary to provide
              our services, comply with legal obligations, resolve disputes, and
              enforce our agreements. Student data is typically retained for the
              duration of the educational relationship and deleted upon request
              or when no longer needed.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may update this Privacy Policy periodically. We will notify
              users of material changes via email or platform notification.
              Continued use of iProf Tutor after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our
              data practices, please contact:
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Privacy Officer:</strong> iProf Tutor Inc.
              <br />
              <strong>Email:</strong> privacy@iproftutor.com
              <br />
              <strong>Mail:</strong> [Your Company Address]
              <br />
              <strong>Phone:</strong> [Your Contact Number]
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
