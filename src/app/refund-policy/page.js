export const metadata = {
  title: 'Refund & Cancellation Policy — Rameshwaram Ayurveda',
  description:
    'Understand the refund, return, and cancellation policy for orders placed on Rameshwaram Ayurveda.',
};

export default function RefundPolicyPage() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <h1>Refund &amp; Cancellation Policy</h1>
          <p className="policy-effective">
            Effective Date: <strong>April 11, 2025</strong>
          </p>
          <p className="policy-intro">
            At <strong>Rameshwaram Ayurveda</strong>, we strive to deliver quality Ayurvedic
            products in perfect condition. This policy outlines the terms under which we accept
            cancellations, process refunds, and handle returns. Please read it carefully before
            placing your order.
          </p>
        </div>

        <nav className="policy-toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#cancellation">Order Cancellation Policy</a></li>
            <li><a href="#refund-eligibility">Refund Eligibility</a></li>
            <li><a href="#non-refundable">Non-Refundable Cases</a></li>
            <li><a href="#refund-process">Refund Process &amp; Timeline</a></li>
            <li><a href="#cod-refunds">COD Refunds</a></li>
            <li><a href="#return-shipping">Return Shipping</a></li>
            <li><a href="#contact">Contact for Support</a></li>
          </ol>
        </nav>

        <section id="cancellation" className="policy-section">
          <h2>1. Order Cancellation Policy</h2>

          <h3>1.1 Cancellation Before Shipment</h3>
          <p>
            You may cancel your order <strong>before it is dispatched</strong> from our warehouse.
            To request a cancellation:
          </p>
          <ul>
            <li>Email us at <a href="mailto:support@rameshwaramayurveda.com">support@rameshwaramayurveda.com</a> with your <strong>Order ID</strong>.</li>
            <li>Contact us via WhatsApp at <a href="tel:+919632324141">+91 96323 24141</a>.</li>
          </ul>
          <p>
            Cancellation requests will be processed during business hours (Monday–Saturday,
            10:00 AM – 6:00 PM IST). Orders that have already been dispatched cannot be cancelled.
          </p>

          <h3>1.2 Cancellation by Rameshwaram Ayurveda</h3>
          <p>We reserve the right to cancel an order in the following situations:</p>
          <ul>
            <li>The product is out of stock or no longer available.</li>
            <li>The shipping address is outside our serviceable area.</li>
            <li>Suspicion of fraudulent activity or policy abuse.</li>
            <li>Pricing errors on the website at the time of order placement.</li>
          </ul>
          <p>
            In all such cases, if a payment was made, a <strong>full refund</strong> will be
            initiated to the original payment method.
          </p>
        </section>

        <section id="refund-eligibility" className="policy-section">
          <h2>2. Refund Eligibility</h2>
          <p>
            We accept refund requests only under the following specific circumstances. Refund
            requests must be raised within <strong>48 hours</strong> of delivery.
          </p>
          <div className="policy-grid">
            <div className="policy-grid-item policy-grid-item--eligible">
              <h3>✅ Eligible for Refund</h3>
              <ul>
                <li><strong>Damaged Product:</strong> The product arrived physically damaged or broken due to transit mishandling.</li>
                <li><strong>Wrong Product Delivered:</strong> You received a product different from what you ordered.</li>
                <li><strong>Incomplete Order:</strong> One or more items from your order were missing upon delivery.</li>
                <li><strong>Expired Product:</strong> The product delivered is past its expiry date.</li>
              </ul>
            </div>
          </div>

          <h3>How to Raise a Refund Request</h3>
          <ol>
            <li>
              Email <a href="mailto:support@rameshwaramayurveda.com">support@rameshwaramayurveda.com</a> with:
              <ul>
                <li>Your Order ID</li>
                <li>Clear photographs of the damaged/incorrect product</li>
                <li>A brief description of the issue</li>
              </ul>
            </li>
            <li>Our team will review your request and respond within <strong>2 business days</strong>.</li>
            <li>Once approved, the refund will be processed as per the timeline in Section 4.</li>
          </ol>
        </section>

        <section id="non-refundable" className="policy-section">
          <h2>3. Non-Refundable Cases</h2>
          <p>
            Given the consumable and perishable nature of Ayurvedic products, refunds will
            <strong> not </strong>be issued in the following situations:
          </p>
          <div className="policy-notice policy-notice--warning">
            <strong>Please note:</strong> These restrictions are in place to ensure product
            integrity and hygiene standards for all customers.
          </div>
          <ul>
            <li>Products that have been <strong>opened, used, or partially consumed</strong>.</li>
            <li>Products returned without the original packaging, labels, or seal.</li>
            <li>Damage caused by improper storage or handling after delivery.</li>
            <li>Change of mind or personal preference after delivery.</li>
            <li>Refund requests raised <strong>after 48 hours</strong> of delivery.</li>
            <li>Products purchased during sale or at a discounted price, unless damaged or incorrect.</li>
            <li>Items reported as missing without clear evidence supporting the claim.</li>
          </ul>
        </section>

        <section id="refund-process" className="policy-section">
          <h2>4. Refund Process &amp; Timeline</h2>
          <p>Once your refund request is reviewed and approved, the following process applies:</p>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-step">1</div>
              <div className="timeline-content">
                <strong>Approval Notification</strong>
                <p>You will receive an email confirming your refund has been approved.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-step">2</div>
              <div className="timeline-content">
                <strong>Refund Initiation</strong>
                <p>The refund is initiated to your original payment method via Razorpay within <strong>1–2 business days</strong> of approval.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-step">3</div>
              <div className="timeline-content">
                <strong>Credit to Account</strong>
                <p>The amount will reflect in your account within <strong>5–7 business days</strong> depending on your bank or payment provider.</p>
              </div>
            </div>
          </div>
          <p>
            Total timeline from approval to receipt:{' '}
            <strong>5–7 business days</strong>. Delays beyond this are subject to your bank&apos;s
            processing timelines, which are outside our control.
          </p>
        </section>

        <section id="cod-refunds" className="policy-section">
          <h2>5. Cash on Delivery (COD) Refunds</h2>
          <p>
            For orders paid via Cash on Delivery, refunds cannot be issued in cash. Instead, the
            refund amount will be transferred directly to your <strong>bank account</strong> via NEFT
            or UPI.
          </p>
          <p>To process a COD refund, you will be required to provide:</p>
          <ul>
            <li>Your full name (as per bank records)</li>
            <li>Bank account number</li>
            <li>IFSC code</li>
            <li>UPI ID (as an alternative)</li>
          </ul>
          <p>
            COD refunds are processed within <strong>7–10 business days</strong> from the date of
            approval, subject to bank processing time.
          </p>
        </section>

        <section id="return-shipping" className="policy-section">
          <h2>6. Return Shipping</h2>
          <ul>
            <li>
              If a return is required (for wrong or damaged products), we will arrange a
              <strong> reverse pickup</strong> at no additional cost to you in serviceable areas.
            </li>
            <li>
              In areas where reverse pickup is not available, you may be asked to self-ship the
              product to our warehouse. In such cases, reasonable return shipping charges (up to
              ₹100) will be reimbursed along with your refund.
            </li>
            <li>
              Products must be returned in their <strong>original, sealed packaging</strong> with
              all labels intact. Returns of opened or tampered products will not be accepted.
            </li>
            <li>
              We recommend using a trackable shipping service for self-shipped returns. We are not
              responsible for items lost in transit during a self-arranged return.
            </li>
          </ul>
        </section>

        <section id="contact" className="policy-section">
          <h2>7. Contact for Support</h2>
          <p>
            Our customer support team is available to assist you with cancellations, refunds, and
            returns:
          </p>
          <div className="contact-card">
            <p><strong>Rameshwaram Ayurveda — Customer Support</strong></p>
            <p>📧 Email: <a href="mailto:support@rameshwaramayurveda.com">support@rameshwaramayurveda.com</a></p>
            <p>📞 WhatsApp / Phone: <a href="tel:+919632324141">+91 96323 24141</a></p>
            <p>⏰ Business Hours: Monday – Saturday, 10:00 AM – 6:00 PM IST</p>
          </div>
          <p>
            Please provide your <strong>Order ID</strong> and relevant photographs when reaching
            out, to help us resolve your concern as quickly as possible.
          </p>
          <p className="policy-jurisdiction">
            This policy is subject to the laws of India, including the Consumer Protection Act,
            2019. Rameshwaram Ayurveda reserves the right to update this policy at any time. The
            policy in effect at the time of your order shall apply.
          </p>
        </section>
      </div>
    </div>
  );
}
