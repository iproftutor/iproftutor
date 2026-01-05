import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
          Legal Information
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Company Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              iProf Tutor is a technology platform providing AI-powered
              educational services for K-12 students, teachers, and parents.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Company Name:</strong> iProf Tutor Inc.
              <br />
              <strong>Registered Address:</strong> [Your Company Address]
              <br />
              <strong>Contact Email:</strong> legal@iproftutor.com
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All content, features, and functionality on iProf Tutor, including
              but not limited to text, graphics, logos, icons, images, audio
              clips, video clips, data compilations, and software, are the
              exclusive property of iProf Tutor Inc. or its content suppliers
              and are protected by United States and international copyright
              laws.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The iProf Tutor name, logo, and all related names, logos, product
              and service names, designs, and slogans are trademarks of iProf
              Tutor Inc. or its affiliates or licensors. You must not use such
              marks without our prior written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Compliance & Regulations
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              iProf Tutor complies with applicable education technology laws and
              regulations, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Children's Online Privacy Protection Act (COPPA)</li>
              <li>Family Educational Rights and Privacy Act (FERPA)</li>
              <li>
                General Data Protection Regulation (GDPR) where applicable
              </li>
              <li>California Consumer Privacy Act (CCPA)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceptable Use
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Users of iProf Tutor agree to use the platform only for lawful
              purposes and in accordance with our Terms of Service. Prohibited
              activities include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Violating any applicable laws or regulations</li>
              <li>Impersonating or attempting to impersonate another person</li>
              <li>
                Interfering with or disrupting the platform's functionality
              </li>
              <li>
                Attempting to gain unauthorized access to any portion of the
                platform
              </li>
              <li>Using the platform to transmit harmful or malicious code</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              To the fullest extent permitted by applicable law, iProf Tutor
              Inc. shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly, or any loss of
              data, use, goodwill, or other intangible losses resulting from
              your access to or use of or inability to access or use the
              services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dispute Resolution
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Any disputes arising out of or relating to these legal terms or
              the use of iProf Tutor shall be resolved through binding
              arbitration in accordance with the rules of the American
              Arbitration Association, except where prohibited by law.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Updates to Legal Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to update or modify this legal information at
              any time. Changes will be effective immediately upon posting. Your
              continued use of iProf Tutor after any changes constitutes
              acceptance of those changes.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Last Updated:</strong>{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Information
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you have any questions about this legal information, please
              contact us at:
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Email:</strong> legal@iproftutor.com
              <br />
              <strong>Mail:</strong> iProf Tutor Inc., Legal Department, [Your
              Company Address]
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
