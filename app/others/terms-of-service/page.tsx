import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
          Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By accessing or using iProf Tutor ("Service," "Platform"), you
              agree to be bound by these Terms of Service ("Terms"). If you do
              not agree to these Terms, do not use the Service.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              For users under 18 years of age, a parent or legal guardian must
              review and accept these Terms on your behalf.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Account Registration
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To use certain features of the Service, you must create an
              account:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                You must provide accurate, current, and complete information
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials
              </li>
              <li>
                You are responsible for all activities that occur under your
                account
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your
                account
              </li>
              <li>
                Users under 13 require parental consent to create an account
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. User Roles and Responsibilities
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Students
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Use the platform for educational purposes only</li>
              <li>Complete assignments and activities honestly</li>
              <li>Respect other users and maintain appropriate conduct</li>
              <li>Follow school and parent guidelines for platform use</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Parents/Guardians
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Monitor your child's use of the platform</li>
              <li>
                Provide accurate information and parental consent where required
              </li>
              <li>Review progress reports and learning data</li>
              <li>Communicate with teachers and administrators as needed</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Teachers/Educators
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Use the platform to support student learning</li>
              <li>Maintain professional conduct and interactions</li>
              <li>Protect student privacy and data</li>
              <li>
                Comply with school district policies and educational regulations
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Subscription and Payments
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              iProf Tutor offers both free and paid subscription plans:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                <strong>Free Plan:</strong> Limited access to basic features
              </li>
              <li>
                <strong>Paid Plans:</strong> Monthly or annual subscriptions
                with full feature access
              </li>
              <li>
                <strong>Billing:</strong> Subscriptions automatically renew
                unless canceled
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel at any time;
                cancellation takes effect at the end of the current billing
                period
              </li>
              <li>
                <strong>Refunds:</strong> Refunds are provided in accordance
                with our refund policy
              </li>
              <li>
                <strong>Price Changes:</strong> We reserve the right to modify
                pricing with advance notice
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Acceptable Use Policy
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>
                Violate any applicable laws, regulations, or third-party rights
              </li>
              <li>Use the Service for any unauthorized commercial purpose</li>
              <li>Upload or transmit viruses, malware, or harmful code</li>
              <li>
                Attempt to gain unauthorized access to the Service or user
                accounts
              </li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Collect or harvest user information without consent</li>
              <li>
                Use automated systems (bots, scrapers) without authorization
              </li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Intellectual Property Rights
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All content on iProf Tutor, including text, graphics, logos,
              software, and educational materials, is the property of iProf
              Tutor Inc. or its licensors and is protected by copyright,
              trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              You are granted a limited, non-exclusive, non-transferable license
              to access and use the Service for personal, non-commercial
              educational purposes. You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Copy, modify, or create derivative works of our content</li>
              <li>Distribute, sell, or license any part of the Service</li>
              <li>Remove copyright or proprietary notices</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. User-Generated Content
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You retain ownership of content you create on the platform
              (assignments, projects, posts). By submitting content, you grant
              iProf Tutor a worldwide, royalty-free license to use, store, and
              display such content solely for the purpose of providing the
              Service.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              You represent that you have all necessary rights to submit content
              and that your content does not violate any laws or third-party
              rights.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Privacy and Data Protection
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your use of the Service is subject to our Privacy Policy, which
              explains how we collect, use, and protect your information. We are
              committed to protecting student privacy in compliance with COPPA,
              FERPA, GDPR, and other applicable privacy laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Third-Party Services and Links
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The Service may contain links to third-party websites or services.
              We are not responsible for the content, privacy policies, or
              practices of third-party sites. Your use of third-party services
              is at your own risk.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Disclaimers and Limitations of Liability
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Service "As Is":</strong> The Service is provided "as is"
              and "as available" without warranties of any kind, express or
              implied. We do not guarantee that the Service will be
              uninterrupted, error-free, or secure.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Educational Tool:</strong> iProf Tutor is an educational
              support tool and does not replace formal education, certified
              teachers, or professional educational services.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Limitation of Liability:</strong> To the fullest extent
              permitted by law, iProf Tutor Inc. shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              including loss of profits, data, or use, arising from your use of
              the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Indemnification
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You agree to indemnify and hold harmless iProf Tutor Inc., its
              affiliates, and their respective officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, and
              expenses arising from your use of the Service or violation of
              these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Termination
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to the
              Service at any time, with or without notice, for violations of
              these Terms or for any other reason. Upon termination:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Your right to use the Service immediately ceases</li>
              <li>
                You may request deletion of your account and associated data
              </li>
              <li>
                We may retain certain information as required by law or for
                legitimate business purposes
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Dispute Resolution and Arbitration
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Any disputes arising from these Terms or use of the Service shall
              be resolved through binding arbitration in accordance with the
              American Arbitration Association rules, except where prohibited by
              law. You waive the right to participate in class action lawsuits.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms shall be governed by the laws of [Your Jurisdiction],
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              14. Changes to Terms
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may modify these Terms at any time. We will notify users of
              material changes via email or platform notification. Continued use
              of the Service after changes constitutes acceptance of the updated
              Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              15. Severability
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision will be limited or eliminated to the
              minimum extent necessary, and the remaining provisions will remain
              in full force and effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              16. Entire Agreement
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              These Terms, together with our Privacy Policy and any other legal
              notices published on the Service, constitute the entire agreement
              between you and iProf Tutor Inc. regarding your use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              17. Contact Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please
              contact:
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>iProf Tutor Inc.</strong>
              <br />
              <strong>Email:</strong> legal@iproftutor.com
              <br />
              <strong>Mail:</strong> [Your Company Address]
              <br />
              <strong>Support:</strong> support@iproftutor.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
