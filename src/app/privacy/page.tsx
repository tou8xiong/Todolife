import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for TodoLife - Personal Task & Life Management",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-slate-900 dark:text-white transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm mb-8">Last Updated: May 10, 2026</p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to TodoLife. We respect your privacy and are committed to protecting your personal data. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
              <p>
                Please read this Privacy Policy carefully. By using TodoLife, you agree to the collection and use of information
                in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">2.1 Personal Information</h3>
              <p className="mb-4">
                When you create an account or use our service, we may collect the following personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Name and email address</li>
                <li>Account credentials (username and encrypted password)</li>
                <li>Profile information (optional)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">2.2 User Content</h3>
              <p className="mb-4">
                We collect and store the content you create, upload, or share through our service, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Tasks, notes, and documents</li>
                <li>PDF files and annotations</li>
                <li>Images uploaded for background removal or OCR processing</li>
                <li>Timer and productivity data</li>
                <li>AI assistant conversation history</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">2.3 Usage Information</h3>
              <p className="mb-4">
                We automatically collect certain information about your device and how you interact with our service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Device information (type, operating system, browser type)</li>
                <li>IP address and general location data</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data (access times, pages viewed, errors encountered)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">2.4 Analytics Data</h3>
              <p>
                We use analytics tools to understand how users interact with our service. This helps us improve functionality
                and user experience. Analytics data is aggregated and anonymized whenever possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">3.1 Service Provision</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>To create and manage your account</li>
                <li>To provide, maintain, and improve our service</li>
                <li>To process and store your content</li>
                <li>To enable features like AI assistance, OCR, and background removal</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">3.2 Communication</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>To send you service-related notifications and updates</li>
                <li>To respond to your inquiries and support requests</li>
                <li>To send you marketing communications (with your consent)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">3.3 Security and Fraud Prevention</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>To detect, prevent, and address technical issues</li>
                <li>To protect against fraud, abuse, and security threats</li>
                <li>To enforce our Terms of Service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">3.4 Analytics and Improvement</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To analyze usage patterns and trends</li>
                <li>To develop new features and improve existing ones</li>
                <li>To personalize your experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">4.1 Data Storage</h3>
              <p className="mb-4">
                Your data is stored securely using industry-standard cloud infrastructure. We use Supabase for database management
                and Firebase for authentication services. Your content is encrypted both in transit and at rest.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">4.2 Security Measures</h3>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Encryption of data in transit using SSL/TLS</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure password hashing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">4.3 Data Retention</h3>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy,
                unless a longer retention period is required by law. When you delete your account, we will delete or anonymize your
                personal data within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">5.1 We Do Not Sell Your Data</h3>
              <p className="mb-4">
                We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">5.2 Service Providers</h3>
              <p className="mb-4">
                We may share your information with trusted third-party service providers who assist us in operating our service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Cloud hosting providers (Vercel, Supabase)</li>
                <li>Authentication services (Firebase)</li>
                <li>Analytics providers (anonymized data only)</li>
                <li>Email service providers</li>
              </ul>
              <p className="mb-4">
                These service providers are contractually obligated to protect your data and use it only for the purposes we specify.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">5.3 Legal Requirements</h3>
              <p className="mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities,
                including to meet national security or law enforcement requirements.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">5.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the acquiring entity.
                We will notify you of any such change and provide you with choices regarding your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Privacy Rights</h2>
              <p className="mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">6.1 Access and Portability</h3>
              <p className="mb-4">
                You have the right to access your personal data and request a copy in a portable format.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">6.2 Correction</h3>
              <p className="mb-4">
                You have the right to correct inaccurate or incomplete personal data.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">6.3 Deletion</h3>
              <p className="mb-4">
                You have the right to request deletion of your personal data, subject to certain legal exceptions.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">6.4 Objection and Restriction</h3>
              <p className="mb-4">
                You have the right to object to or restrict certain processing of your personal data.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">6.5 Withdraw Consent</h3>
              <p className="mb-4">
                Where we rely on your consent to process your data, you have the right to withdraw that consent at any time.
              </p>

              <p className="mt-4">
                To exercise any of these rights, please contact us at privacy@todolife.com. We will respond to your request
                within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to enhance your experience and collect usage data.
              </p>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">7.1 Types of Cookies We Use</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Essential Cookies:</strong> Required for the service to function properly</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-4">7.2 Managing Cookies</h3>
              <p>
                You can control cookies through your browser settings. However, disabling certain cookies may affect the
                functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Links</h2>
              <p>
                Our service may contain links to third-party websites or services. We are not responsible for the privacy
                practices of these third parties. We encourage you to review their privacy policies before providing any
                personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
              <p className="mb-4">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information
                from children under 13. If you are a parent or guardian and believe your child has provided us with personal
                information, please contact us immediately.
              </p>
              <p>
                If we discover that we have collected personal information from a child under 13, we will delete that information
                as quickly as possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. These
                countries may have different data protection laws than your country.
              </p>
              <p>
                When we transfer your data internationally, we ensure appropriate safeguards are in place to protect your
                information in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. California Privacy Rights (CCPA)</h2>
              <p className="mb-4">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
              <p>
                To exercise these rights, please contact us at privacy@todolife.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. European Privacy Rights (GDPR)</h2>
              <p className="mb-4">
                If you are located in the European Economic Area (EEA), you have rights under the General Data Protection
                Regulation (GDPR), including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Right of access to your personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Data Processing for AI Features</h2>
              <p className="mb-4">
                When you use our AI-powered features (productivity assistant, image processing), your data is processed as follows:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Image processing (background removal, OCR) is performed in your browser when possible</li>
                <li>AI assistant conversations may be processed by third-party AI providers</li>
                <li>We do not use your content to train AI models without your explicit consent</li>
                <li>Processed data is not retained longer than necessary to provide the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
                operational, or regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Posting the updated Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending you an email notification (for significant changes)</li>
              </ul>
              <p>
                Your continued use of the service after any changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Us</h2>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us:
              </p>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                <p className="font-semibold mb-2">TodoLife Privacy Team</p>
                <p>Email: touxhk@gmail.com</p>
                <p>Phone: +020 7829 2260</p>
                <p>Website: https://www.todolifetask.xyz/</p>
              </div>
            </section>

            <section className="pt-8 border-t border-gray-600">
              <p className="text-sm text-gray-400">
                By using TodoLife, you acknowledge that you have read and understood this Privacy Policy and agree to
                the collection, use, and disclosure of your information as described herein.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
