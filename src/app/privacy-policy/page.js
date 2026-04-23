export const metadata = {
  title: 'Privacy Policy — Rameshwaram Ayurveda',
  description:
    'Learn how Rameshwaram Ayurveda collects, uses, and protects your personal data in compliance with Indian IT laws.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <h1>Privacy Policy</h1>
          <p className="policy-effective">
            Effective Date: <strong>April 11, 2025</strong>
          </p>
          <p className="policy-intro">
            Welcome to <strong>Rameshwaram Ayurveda</strong>. We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you visit our website and
            make purchases from us. Please read it carefully.
          </p>
        </div>

        <nav className="policy-toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#information-we-collect">Information We Collect</a></li>
            <li><a href="#how-we-use">How We Use Your Information</a></li>
            <li><a href="#payment-security">Payment Security</a></li>
            <li><a href="#cookies">Cookies &amp; Tracking</a></li>
            <li><a href="#data-sharing">Data Sharing &amp; Third Parties</a></li>
            <li><a href="#data-retention">Data Retention</a></li>
            <li><a href="#user-rights">Your Rights</a></li>
            <li><a href="#security">Data Security</a></li>
            <li><a href="#children">Children&apos;s Privacy</a></li>
            <li><a href="#changes">Changes to This Policy</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ol>
        </nav>

        <section id="information-we-collect" className="policy-section">
          <h2>1. Information We Collect</h2>
          <p>When you use our website, we may collect the following categories of information:</p>

          <h3>1.1 Information You Provide Directly</h3>
          <ul>
            <li><strong>Account Information:</strong> Full name, email address, phone number, and password when you register.</li>
            <li><strong>Shipping &amp; Billing Address:</strong> Collected during the checkout process to fulfil your orders.</li>
            <li><strong>Order Information:</strong> Details of products ordered, quantities, and transaction references.</li>
            <li><strong>Communication Data:</strong> Messages or queries you send to our support team.</li>
          </ul>

          <h3>1.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, and browsing behaviour on our website.</li>
            <li><strong>Device &amp; Technical Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Cookies &amp; Similar Technologies:</strong> Authentication tokens and analytics identifiers (see Section 4).</li>
          </ul>

          <h3>1.3 Information From Third Parties</h3>
          <ul>
            <li><strong>Payment Processors:</strong> Razorpay provides us with a payment reference ID and transaction status. We do not receive or store your full card or bank account details.</li>
            <li><strong>Analytics Providers:</strong> Vercel Analytics may share aggregated, anonymised usage statistics.</li>
          </ul>
        </section>

        <section id="how-we-use" className="policy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Order Fulfilment:</strong> Processing, confirming, and delivering your orders and sending related notifications via email or SMS.</li>
            <li><strong>Account Management:</strong> Creating and maintaining your user account, and authenticating your identity on login.</li>
            <li><strong>Customer Support:</strong> Responding to your queries, complaints, and return or refund requests.</li>
            <li><strong>Payment Processing:</strong> Initiating and verifying transactions through our payment partners.</li>
            <li><strong>Website Improvement:</strong> Analysing usage trends and performance metrics to enhance user experience.</li>
            <li><strong>Legal Compliance:</strong> Meeting our obligations under applicable Indian laws, including the Information Technology Act, 2000 and applicable Consumer Protection rules.</li>
            <li><strong>Marketing Communications:</strong> With your consent, sending promotional offers, newsletters, and product updates. You may opt out at any time.</li>
          </ul>
          <p>We will not use your personal information for any purpose other than those described above without obtaining your prior consent.</p>
        </section>

        <section id="payment-security" className="policy-section">
          <h2>3. Payment Security</h2>
          <p>
            All online payment transactions on our website are processed securely through{' '}
            <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. We do not store, process,
            or transmit your credit card numbers, debit card details, net banking credentials, or UPI
            PINs on our servers.
          </p>
          <ul>
            <li>Razorpay handles all sensitive payment data under their own privacy and security policies.</li>
            <li>We store only the <strong>Razorpay Order ID</strong> and <strong>Payment ID</strong> for order tracking and dispute resolution.</li>
          </ul>
          <p>
            We encourage you to review{' '}
            <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">
              Razorpay&apos;s Privacy Policy
            </a>{' '}
            for details on how they handle your payment information.
          </p>
        </section>

        <section id="cookies" className="policy-section">
          <h2>4. Cookies &amp; Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to operate and improve our website. By
            continuing to use our site, you consent to our use of cookies in accordance with this
            policy.
          </p>

          <h3>Types of Cookies We Use</h3>
          <div className="cookie-table-wrapper">
            <table className="cookie-table">
              <thead>
                <tr>
                  <th>Cookie Type</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Essential</strong></td>
                  <td>Authentication token to keep you logged in securely</td>
                  <td>Session / 7 days</td>
                </tr>
                <tr>
                  <td><strong>Analytics</strong></td>
                  <td>Vercel Analytics — anonymised page views and performance metrics</td>
                  <td>Up to 1 year</td>
                </tr>
                <tr>
                  <td><strong>Functional</strong></td>
                  <td>Remembering cart contents and user preferences</td>
                  <td>Session</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            You can control or disable cookies through your browser settings. Disabling essential
            cookies may affect your ability to log in or place orders.
          </p>
        </section>

        <section id="data-sharing" className="policy-section">
          <h2>5. Data Sharing &amp; Third Parties</h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We may share
            your data only in the following circumstances:
          </p>
          <ul>
            <li>
              <strong>Payment Gateway (Razorpay):</strong> Your name, email, phone number, and order
              amount are shared with Razorpay solely to process your payment.
            </li>
            <li>
              <strong>Shipping &amp; Logistics Partners:</strong> Your name, phone number, and delivery
              address are shared with our third-party courier and logistics partners to fulfil your
              delivery.
            </li>
            <li>
              <strong>Cloud Infrastructure:</strong> Our website is hosted on <strong>Vercel</strong>,
              our database is managed via <strong>MongoDB Atlas</strong>, and product images are
              served through <strong>Cloudinary</strong>. These providers process data strictly to
              provide their services and are bound by their respective data processing agreements.
            </li>
            <li>
              <strong>Legal Obligations:</strong> We may disclose your information if required by
              law, court order, or any governmental or regulatory authority in India.
            </li>
          </ul>
        </section>

        <section id="data-retention" className="policy-section">
          <h2>6. Data Retention</h2>
          <p>We retain your personal information for as long as necessary to fulfil the purposes outlined in this policy:</p>
          <ul>
            <li><strong>Account Data:</strong> Retained for the duration of your account and for up to <strong>3 years</strong> after account closure for legal and dispute resolution purposes.</li>
            <li><strong>Order Records:</strong> Retained for a minimum of <strong>7 years</strong> as required under Indian accounting and tax laws.</li>
            <li><strong>Support Communications:</strong> Retained for <strong>2 years</strong> from the date of resolution.</li>
            <li><strong>Analytics Data:</strong> Anonymised and aggregated; retained indefinitely for business improvement.</li>
          </ul>
          <p>
            When data is no longer required, we delete or anonymise it in a secure manner in
            accordance with applicable law.
          </p>
        </section>

        <section id="user-rights" className="policy-section">
          <h2>7. Your Rights</h2>
          <p>
            Under the <strong>Information Technology Act, 2000</strong> and the{' '}
            <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, you have the
            following rights with respect to your personal data:
          </p>
          <ul>
            <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data. You can also update your details directly from your account dashboard.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to our legal retention obligations.</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time by clicking "Unsubscribe" in our emails or contacting us.</li>
            <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint or concern with our designated Grievance Officer (see Section 11).</li>
          </ul>
          <p>To exercise any of these rights, please contact us at the details provided in the Contact section below. We will respond within <strong>30 days</strong> of receiving your request.</p>
        </section>

        <section id="security" className="policy-section">
          <h2>8. Data Security</h2>
          <p>
            We implement industry-standard technical and organisational measures to protect your
            personal data from unauthorised access, disclosure, alteration, or destruction. These
            measures include:
          </p>
          <ul>
            <li>HTTPS encryption for all data in transit.</li>
            <li>Secure, hashed storage of passwords — plain-text passwords are never stored.</li>
            <li>Access controls limiting who within our organisation can access your data.</li>
            <li>Regular security reviews of our infrastructure and code.</li>
          </ul>
          <p>
            While we take all reasonable steps to protect your data, no transmission over the
            internet or method of electronic storage is 100% secure. We cannot guarantee absolute
            security.
          </p>
        </section>

        <section id="children" className="policy-section">
          <h2>9. Children&apos;s Privacy</h2>
          <p>
            Our website is not directed at individuals under the age of <strong>18 years</strong>.
            We do not knowingly collect personal information from minors. If you are a parent or
            guardian and believe your child has provided us with personal information, please contact
            us immediately and we will take steps to delete such data.
          </p>
        </section>

        <section id="changes" className="policy-section">
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We reserve the right to update or modify this Privacy Policy at any time. Changes will
            be posted on this page with an updated effective date. If significant changes are made,
            we will notify you via email or a prominent notice on our website. Your continued use
            of the website after such changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section id="contact" className="policy-section">
          <h2>11. Contact Us &amp; Grievance Officer</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your
            personal data, please contact our Grievance Officer:
          </p>
          <div className="contact-card">
            <p><strong>Rameshwaram Ayurveda</strong></p>
            <p>📧 Email: <a href="mailto:support@rameshwaramayurveda.com">support@rameshwaramayurveda.com</a></p>
            <p>📞 Phone: <a href="tel:+919632324141">+91 96323 24141</a></p>
            <p>⏰ Response Time: Within 30 days of receipt of your complaint or request.</p>
          </div>
          <p className="policy-jurisdiction">
            This Privacy Policy is governed by and construed in accordance with the laws of India.
            Any disputes arising shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>
      </div>
    </div>
  );
}
