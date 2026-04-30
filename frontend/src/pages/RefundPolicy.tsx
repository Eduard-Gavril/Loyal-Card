import { useNavigate } from 'react-router-dom'

export default function RefundPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Refund Policy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-blue max-w-none text-gray-900">
            
            <p><strong>Last updated April 26, 2026</strong></p>

            <p>Thank you for choosing LoyalCard for your business loyalty program needs. This Refund Policy applies to subscription purchases made by business owners and merchants ("Merchants") who use our SaaS platform. End users (customers of Merchants) use LoyalCard services free of charge and are not subject to this policy.</p>

            <h2 id="section1">1. SUBSCRIPTION SERVICES</h2>
            <p>LoyalCard offers subscription-based plans for businesses to manage their customer loyalty programs. All subscriptions are digital services and no physical products are shipped.</p>

            <h2 id="section2">2. FREE TRIAL PERIOD</h2>
            <p>New Merchants receive a <strong>30-day free trial</strong> period to evaluate our services. During this period:</p>
            <ul>
              <li>Full access to subscribed plan features</li>
              <li>No payment required</li>
              <li>Cancel anytime with no charges</li>
              <li>No automatic billing until trial expires</li>
            </ul>

            <h2 id="section3">3. CANCELLATION & REFUND RIGHTS</h2>
            
            <h3>3.1 Cooling-Off Period (EU Right of Withdrawal)</h3>
            <p>In accordance with EU consumer protection laws, Merchants have the right to cancel their subscription within <strong>14 days</strong> from the date of first payment (after trial period ends) for a full refund, no questions asked.</p>
            <p>To exercise this right, please contact us at: <a href="mailto:eduardgavril.1999@gmail.com">eduardgavril.1999@gmail.com</a></p>

            <h3>3.2 Cancellations After 14 Days</h3>
            <p>After the 14-day cooling-off period:</p>
            <ul>
              <li>You may cancel your subscription at any time</li>
              <li><strong>No refund</strong> will be issued for the current billing period</li>
              <li>You retain full access to services until the end of your paid period</li>
              <li>Your account will automatically downgrade to free tier at subscription expiration</li>
              <li>No automatic renewal charges will occur</li>
            </ul>

            <h2 id="section4">4. HOW TO CANCEL</h2>
            <p>To cancel your subscription:</p>
            <ol>
              <li>Log in to your LoyalCard admin dashboard</li>
              <li>Navigate to Settings → Subscription</li>
              <li>Click "Cancel Subscription"</li>
              <li>Confirm cancellation</li>
            </ol>
            <p>Alternatively, email us at <a href="mailto:eduardgavril.1999@gmail.com">eduardgavril.1999@gmail.com</a> with your account details.</p>

            <h2 id="section5">5. REFUND PROCESSING</h2>
            <p>Approved refunds will be processed within <strong>14 business days</strong> of approval. Refunds will be issued to the original payment method used for purchase.</p>
            <p>Please allow 1-2 billing cycles for the refund to appear on your statement, depending on your financial institution.</p>

            <h2 id="section6">6. PLAN CHANGES</h2>
            
            <h3>6.1 Upgrades</h3>
            <p>When upgrading to a higher-tier plan:</p>
            <ul>
              <li>New features become available immediately</li>
              <li>Price difference is charged at next billing cycle</li>
              <li>No immediate pro-rated charges</li>
            </ul>

            <h3>6.2 Downgrades</h3>
            <p>When downgrading to a lower-tier plan:</p>
            <ul>
              <li>Current plan features remain active until end of billing period</li>
              <li>New lower-tier plan activates at next renewal date</li>
              <li>No refund for difference between plans</li>
            </ul>

            <h2 id="section7">7. TECHNICAL ISSUES & SERVICE CREDITS</h2>
            <p>If you experience significant service disruptions due to technical problems on our end:</p>
            <ul>
              <li>Report the issue to <a href="mailto:eduardgavril.1999@gmail.com">eduardgavril.1999@gmail.com</a></li>
              <li>We will investigate within 48 hours</li>
              <li>For confirmed outages exceeding 24 cumulative hours in a billing period, we will issue a <strong>pro-rated refund</strong> for downtime days</li>
              <li>Service Level Agreement (SLA) details available in Terms of Service</li>
            </ul>

            <h2 id="section8">8. EXCEPTIONS - NO REFUNDS</h2>
            <p>Refunds will <strong>not</strong> be issued in the following cases:</p>
            <ul>
              <li>Violation of our Terms of Service or Acceptable Use Policy</li>
              <li>Account suspension or termination due to fraudulent activity</li>
              <li>Change of mind after 14-day cooling-off period</li>
              <li>Failure to cancel before renewal date</li>
              <li>Misunderstanding of features or capabilities (trial period is provided to evaluate)</li>
              <li>Third-party service integrations not working (unless caused by LoyalCard platform)</li>
            </ul>

            <h2 id="section9">9. CHARGEBACKS</h2>
            <p>If you initiate a chargeback or payment dispute with your bank/credit card company:</p>
            <ul>
              <li>Your account will be immediately suspended pending resolution</li>
              <li>We reserve the right to charge a €25 administrative fee for processing chargebacks</li>
              <li>Please contact us directly first to resolve any billing issues</li>
            </ul>

            <h2 id="section10">10. FREE TIER USERS</h2>
            <p>End users (customers who use merchant loyalty cards) and merchants using the free tier have no paid subscriptions and are therefore not subject to refund policies. These users may discontinue use of LoyalCard services at any time.</p>

            <h2 id="section11">11. ANNUAL SUBSCRIPTIONS</h2>
            <p>For annual (yearly) subscription plans:</p>
            <ul>
              <li>Same 14-day cooling-off period applies for full refund</li>
              <li>After 14 days, cancellation results in access until subscription year ends</li>
              <li>No pro-rated refunds for unused months</li>
              <li>Annual plans cannot be downgraded mid-term (change effective at renewal)</li>
            </ul>

            <h2 id="section12">12. CURRENCY & EXCHANGE RATES</h2>
            <p>All prices are listed in EUR (€). If you paid in a different currency:</p>
            <ul>
              <li>Refunds are processed in the original payment currency</li>
              <li>Exchange rate fluctuations between purchase and refund dates are not our responsibility</li>
              <li>Your financial institution's exchange rate at time of refund processing applies</li>
            </ul>

            <h2 id="section13">13. DATA RETENTION AFTER CANCELLATION</h2>
            <p>Upon subscription cancellation:</p>
            <ul>
              <li>Your data remains accessible in read-only mode for 30 days</li>
              <li>After 30 days, data is archived (not deleted) per GDPR requirements</li>
              <li>You may request data export or deletion via email</li>
              <li>See our Privacy Policy for full data handling details</li>
            </ul>

            <h2 id="section14">14. MODIFICATIONS TO REFUND POLICY</h2>
            <p>We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to our website. Your continued use of LoyalCard services after policy changes constitutes acceptance of the updated terms.</p>
            <p>Material changes that negatively impact existing subscribers will be communicated via email 30 days in advance.</p>

            <h2 id="section15">15. CONTACT INFORMATION</h2>
            <p>For refund requests, cancellations, or questions about this policy:</p>
            <p>
              <strong>Email:</strong> <a href="mailto:eduardgavril.1999@gmail.com">eduardgavril.1999@gmail.com</a><br />
              <strong>Company:</strong> LoyalCard<br />
              <strong>Address:</strong> Aleea Petru Rares, Targu Frumos, Iasi, Romania 705300<br />
              <strong>Phone:</strong> +40 750 438 655
            </p>
            <p>We aim to respond to all refund inquiries within 2 business days.</p>

            <hr className="my-8" />

            <p className="text-sm text-gray-600">
              This Refund Policy was created using Termly's Return and Refund Policy Generator and customized for LoyalCard SaaS platform.
            </p>

          </div>
        </div>
      </main>
    </div>
  )
}
