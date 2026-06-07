import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for TodoLife - Personal Task & Life Management",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-slate-900 dark:text-white transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 p-8 sm:p-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-8">Last Updated: May 10, 2026</p>

          <div className="space-y-8 text-slate-600 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to TodoLife. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms").
                If you do not agree to these Terms, please do not use our service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the TodoLife service, including but not limited to
                our website, mobile applications, and any related services (collectively, the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">2. Description of Service</h2>
              <p className="mb-4">
                TodoLife is a personal task and life management platform that provides the following features:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Task management and organization</li>
                <li>Study timer and productivity tracking</li>
                <li>PDF annotation tools</li>
                <li>Idea notes and text editing</li>
                <li>AI-powered productivity assistant</li>
                <li>Background image removal</li>
                <li>Image to text conversion (OCR)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">3.1 Account Creation</h3>
              <p className="mb-4">
                To access certain features of the Service, you may be required to create an account. You agree to provide accurate,
                current, and complete information during the registration process and to update such information to keep it accurate,
                current, and complete.
              </p>

              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">3.2 Account Security</h3>
              <p className="mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur
                under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>

              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason,
                including but not limited to violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">4. User Content</h2>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">4.1 Your Content</h3>
              <p className="mb-4">
                You retain all rights to the content you create, upload, or store using our Service ("User Content"). By using our Service,
                you grant us a limited, non-exclusive, royalty-free license to store, process, and display your User Content solely for
                the purpose of providing the Service to you.
              </p>

              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">4.2 Content Responsibility</h3>
              <p className="mb-4">
                You are solely responsible for your User Content. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>You own or have the necessary rights to use and authorize us to use your User Content</li>
                <li>Your User Content does not violate any third-party rights, including intellectual property rights</li>
                <li>Your User Content does not contain any illegal, harmful, or offensive material</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-200 mb-3 mt-4">4.3 Content Removal</h3>
              <p>
                We reserve the right to remove any User Content that violates these Terms or that we deem inappropriate,
                without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">5. Acceptable Use</h2>
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful, threatening, abusive, or offensive content</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems (bots, scrapers) without our express written permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service for any commercial purpose without our authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">6. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content (excluding User Content), features, and functionality are owned by TodoLife
                and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">7. Third-Party Services</h2>
              <p className="mb-4">
                Our Service may contain links to third-party websites or services that are not owned or controlled by TodoLife.
                We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any
                third-party websites or services.
              </p>
              <p>
                You acknowledge and agree that we shall not be responsible or liable for any damage or loss caused by your use
                of any third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">8. Disclaimer of Warranties</h2>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TODOLIFE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
                OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p>
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS,
                OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless TodoLife and its officers, directors, employees, and agents from
                any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in
                any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">11. Data Backup</h2>
              <p>
                While we take reasonable measures to protect your data, you are responsible for maintaining your own backup copies
                of your User Content. We are not responsible for any loss or corruption of your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">12. Modifications to Service</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or
                without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation
                of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">13. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to update or modify these Terms at any time. We will notify you of any material changes by
                posting the new Terms on this page and updating the "Last Updated" date.
              </p>
              <p>
                Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TodoLife
                operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">15. Dispute Resolution</h2>
              <p className="mb-4">
                Any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration
                in accordance with the rules of the applicable arbitration association, except that either party may seek injunctive
                or other equitable relief in a court of competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">16. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated
                to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">17. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-white/80 dark:bg-gray-900/50 rounded-lg p-4 border border-slate-200 dark:border-gray-600">
                <p className="font-semibold">TodoLife Support</p>
                <p>Email: touxhk@gmail.com</p>
                <p>Phone: +020 7829 2260</p>
                <p>Website: https://www.todolifetask.xyz/</p>
              </div>
            </section>

            <section className="pt-8 border-t border-slate-200 dark:border-gray-600">
              <p className="text-sm text-slate-500 dark:text-gray-400">
                By using TodoLife, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
