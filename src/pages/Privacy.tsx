"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition, fadeInUp } from "@/lib/animations";
import PageFooter from "@/components/PageFooter";
import SiteHeader from "@/components/SiteHeader";

const Privacy: React.FC = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-black">
        <SiteHeader 
          onOpenMenu={() => {}}
          onOpenSignup={() => {}}
          onOpenLogin={() => {}}
        />
        
        <main className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mb-8"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-6"
              >
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </Link>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gold/10 rounded-lg">
                  <Shield size={32} className="text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    Privacy Policy
                  </h1>
                  <p className="text-rainy-grey text-sm">
                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="prose prose-invert max-w-none"
            >
              <div className="bg-nero/50 rounded-lg p-6 sm:p-8 mb-8 border border-steel-wool/30">
                <p className="text-rainy-grey leading-relaxed text-base sm:text-lg">
                  At AllyTZ Panel, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services. By using our services, you consent to the data practices described in this policy.
                </p>
              </div>

              {/* Section 1 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.1 Personal Information</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We collect information that you provide directly to us when you:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Create an account (name, email address, phone number)</li>
                  <li>Subscribe to our trading signals service</li>
                  <li>Purchase premium features or services</li>
                  <li>Contact us for support or inquiries</li>
                  <li>Participate in surveys, contests, or promotions</li>
                  <li>Update your profile or preferences</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.2 Payment Information</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  When you make purchases or subscribe to our services, we collect:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Payment method details (processed securely through third-party payment processors)</li>
                  <li>Billing address and contact information</li>
                  <li>Transaction history and subscription details</li>
                  <li>Purchase preferences and usage patterns</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.3 Usage Information</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We automatically collect certain information about your device and how you interact with our services:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Device information (model, operating system, unique device identifiers)</li>
                  <li>IP address and location data (with your permission)</li>
                  <li>Browser type and version</li>
                  <li>Pages visited, features used, and time spent on our services</li>
                  <li>Search queries and navigation patterns</li>
                  <li>Error logs and performance data</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">1.4 Trading and Financial Data</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  When you use our trading signals and analysis services, we may collect:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Trading preferences and risk tolerance</li>
                  <li>Signal interaction history</li>
                  <li>Analysis purchase history</li>
                  <li>Subscription status and usage</li>
                  <li>Notification preferences (WhatsApp, email, Telegram)</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">2. How We Use Your Information</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Service Delivery:</strong> To provide, maintain, and improve our trading signals, analysis, and educational services</li>
                  <li><strong className="text-white">Transaction Processing:</strong> To process payments, manage subscriptions, and send transaction-related information</li>
                  <li><strong className="text-white">Communication:</strong> To send you trading signals, market analyses, educational content, and service updates via WhatsApp, email, or Telegram (based on your preferences)</li>
                  <li><strong className="text-white">Customer Support:</strong> To respond to your inquiries, provide technical support, and address issues</li>
                  <li><strong className="text-white">Personalization:</strong> To customize your experience, recommend relevant content, and improve our services</li>
                  <li><strong className="text-white">Security:</strong> To detect, prevent, and address technical issues, fraud, or security threats</li>
                  <li><strong className="text-white">Legal Compliance:</strong> To comply with legal obligations, enforce our terms of service, and protect our rights</li>
                  <li><strong className="text-white">Analytics:</strong> To analyze usage patterns, improve our services, and develop new features</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">3. Information Sharing and Disclosure</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information in the following situations:
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.1 Service Providers</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We share information with trusted third-party service providers who assist in our operations:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Supabase:</strong> Our database and authentication provider (hosted infrastructure)</li>
                  <li><strong className="text-white">Facebook/Meta WhatsApp Business API:</strong> For sending WhatsApp notifications (phone numbers and message content)</li>
                  <li><strong className="text-white">Payment Processors:</strong> For processing payments and managing subscriptions (Google Play Billing, payment gateways)</li>
                  <li><strong className="text-white">Email Service Providers:</strong> For sending transactional and marketing emails</li>
                  <li><strong className="text-white">Analytics Providers:</strong> For analyzing usage and improving our services</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Legal Requirements</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We may disclose your information if required by law or in response to:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Court orders, subpoenas, or legal processes</li>
                  <li>Government requests or regulatory requirements</li>
                  <li>Enforcement of our terms of service or policies</li>
                  <li>Protection of our rights, property, or safety</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.3 Business Transfers</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.4 With Your Consent</h3>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We may share your information with your explicit consent or at your direction.
                </p>
              </section>

              {/* Section 4 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">4. Data Security</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Encryption:</strong> Data is encrypted in transit using SSL/TLS and at rest using industry-standard encryption protocols</li>
                  <li><strong className="text-white">Access Controls:</strong> Role-based access controls and authentication mechanisms</li>
                  <li><strong className="text-white">Secure Infrastructure:</strong> Hosted on secure cloud infrastructure with regular security updates</li>
                  <li><strong className="text-white">Regular Audits:</strong> Security assessments and vulnerability testing</li>
                </ul>
                <div className="bg-green-900/20 border-l-4 border-green-500 rounded p-4 my-6">
                  <p className="text-green-400 text-sm">
                    🔒 Your data is protected using industry-standard security measures. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">5. Data Retention</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Active Accounts:</strong> Data is retained while your account is active</li>
                  <li><strong className="text-white">Subscription Data:</strong> Retained for the duration of your subscription and for a reasonable period afterward for record-keeping</li>
                  <li><strong className="text-white">Transaction Records:</strong> Retained as required by law (typically 7 years for financial records)</li>
                  <li><strong className="text-white">Deleted Accounts:</strong> Data may be retained in backups for up to 90 days before permanent deletion</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">6. Your Rights and Choices</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Access:</strong> Request access to your personal information</li>
                  <li><strong className="text-white">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                  <li><strong className="text-white">Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong className="text-white">Objection:</strong> Object to or restrict certain processing activities</li>
                  <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
                  <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications or adjust notification preferences</li>
                </ul>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  To exercise these rights, you can:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>
                    <strong className="text-white">Request Account Deletion:</strong>{" "}
                    <Link to="/dashboard/delete-account" className="text-gold hover:underline">
                      Delete your account and data
                    </Link>{" "}
                    directly from your dashboard (requires login)
                  </li>
                  <li>
                    <strong className="text-white">Contact Us:</strong> Email us at{" "}
                    <a href="mailto:info@allytz.co" className="text-gold hover:underline">
                      info@allytz.co
                    </a>{" "}
                    for other data requests
                  </li>
                </ul>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We will respond to your request within 30 days.
                </p>
              </section>

              {/* Section 7 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">7. Cookies and Tracking Technologies</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to collect and store information about your preferences and usage patterns:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Essential Cookies:</strong> Required for the website to function properly (authentication, security)</li>
                  <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
                  <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our services.
                </p>
              </section>

              {/* Section 8 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">8. Third-Party Services</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  Our services integrate with third-party services that have their own privacy policies:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li><strong className="text-white">Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Privacy Policy</a></li>
                  <li><strong className="text-white">Facebook/Meta WhatsApp:</strong> <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Privacy Policy</a></li>
                  <li><strong className="text-white">Google Play:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Privacy Policy</a></li>
                  <li><strong className="text-white">Payment Processors:</strong> Subject to their respective privacy policies</li>
                </ul>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We encourage you to review the privacy policies of these third-party services. We are not responsible for the privacy practices of third parties.
                </p>
              </section>

              {/* Section 9 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">9. International Data Transfers</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </section>

              {/* Section 10 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">10. Children's Privacy</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately. If we discover that we have collected information from a child, we will delete it promptly.
                </p>
              </section>

              {/* Section 11 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">11. Financial Services Disclaimer</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  AllyTZ Panel provides educational information and trading signals for informational purposes only. We are not a financial advisor, and the information provided should not be considered as financial advice. Trading in financial markets involves substantial risk of loss and is not suitable for all investors. Always conduct your own research and consult with a qualified financial advisor before making any trading decisions.
                </p>
              </section>

              {/* Section 12 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">12. Changes to This Privacy Policy</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside text-rainy-grey space-y-2 mb-4 ml-4">
                  <li>Posting the updated Privacy Policy on this page</li>
                  <li>Updating the "Last updated" date</li>
                  <li>Sending you an email notification (for significant changes)</li>
                  <li>Displaying a notice on our website or mobile app</li>
                </ul>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  Your continued use of our services after any changes constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              {/* Section 13 */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gold mb-4">13. Contact Us</h2>
                <p className="text-rainy-grey leading-relaxed mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-nero/50 rounded-lg p-6 border border-steel-wool/30">
                  <p className="text-white font-semibold mb-2">AllyTZ Panel</p>
                  <p className="text-rainy-grey mb-1">
                    <strong className="text-white">Email:</strong> <a href="mailto:info@allytz.co" className="text-gold hover:underline">info@allytz.co</a>
                  </p>
                  <p className="text-rainy-grey mb-1">
                    <strong className="text-white">Phone:</strong> <a href="tel:+255716885996" className="text-gold hover:underline">+255716885996</a>
                  </p>
                  <p className="text-rainy-grey mb-1">
                    <strong className="text-white">Location:</strong> Dar es salaam, Tanzania
                  </p>
                  <p className="text-rainy-grey">
                    <strong className="text-white">Website:</strong> <a href="https://www.allytz.co" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">www.allytz.co</a>
                  </p>
                </div>
              </section>

              {/* Consent Statement */}
              <div className="bg-nero/50 rounded-lg p-6 border border-steel-wool/30 mt-8">
                <p className="text-rainy-grey leading-relaxed text-sm">
                  By using AllyTZ Panel's website, mobile application, and services, you consent to the collection and use of your information as described in this Privacy Policy. If you do not agree with this policy, please do not use our services.
                </p>
              </div>
            </motion.div>
          </div>
        </main>

        <PageFooter />
      </div>
    </PageTransition>
  );
};

export default Privacy;
