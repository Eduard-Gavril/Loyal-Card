import { useNavigate } from 'react-router-dom'

export default function AcceptableUsePolicy() {
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
          <h1 className="text-2xl font-bold text-gray-900">Acceptable Use Policy</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-blue max-w-none text-gray-900">
            
            <p><strong>Last updated April 26, 2026</strong></p>

            <p>This Acceptable Use Policy ("Policy") is part of our <a href="/terms">Terms of Service</a> ("Legal Terms") and should therefore be read alongside our main Legal Terms: <a href="/terms">loyalcard.net/terms</a>. If you do not agree with these Legal Terms, please refrain from using our Services. Your continued use of our Services implies acceptance of these Legal Terms.</p>

            <p>Please carefully review this Policy which applies to any and all:</p>
            <ul>
              <li>(a) uses of our Services (as defined in "Legal Terms")</li>
              <li>(b) forms, materials, consent tools, comments, post, and all other content available on the Services ("Content")</li>
            </ul>

            <h2 id="section1">WHO WE ARE</h2>
            <p>We are <strong>LoyalCard</strong> ("Company", "we", "us", or "our") a company registered in Romania at Aleea Petru Rares, Targu Frumos, Iasi, Romania 705300. We operate the website <a href="https://loyalcard.net" target="_blank" rel="noopener noreferrer">https://loyalcard.net</a> (the "Site"), as well as any other related products and services that refer or link to this Policy (collectively, the "Services").</p>

            <h2 id="section2">USE OF THE SERVICES</h2>
            <p>When you use the Services, you warrant that you will comply with this Policy and with all applicable laws.</p>

            <p><strong>You also acknowledge that you may not:</strong></p>
            <ul>
              <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Make any unauthorised use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretences.</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.</li>
              <li>Engage in unauthorised framing of or linking to the Services.</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
              <li>Make improper use of our Services, including our support services or submit false reports of abuse or misconduct.</li>
              <li>Engage in any automated use of the Services, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
              <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or the Services connected.</li>
              <li>Attempt to impersonate another user or person or use the username of another user.</li>
              <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
              <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavour or commercial enterprise.</li>
              <li>Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services, except as expressly permitted by applicable law.</li>
              <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
              <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</li>
              <li>Delete the copyright or other proprietary rights notice from any Content.</li>
              <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
              <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.</li>
              <li>Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ("gifs"), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as "spyware" or "passive collection mechanisms" or "pcms").</li>
              <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or using or launching any unauthorised script or other software.</li>
              <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
              <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
              <li>Sell or otherwise transfer your profile.</li>
              <li>Share account credentials with unauthorized third parties.</li>
              <li>Create multiple accounts to abuse free trials or promotional offers.</li>
              <li>Use automated systems, bots, or scripts to interact with the Services.</li>
              <li>Generate or submit fake customer data or fraudulent transactions.</li>
              <li>Engage in any activity that disrupts or degrades platform performance.</li>
              <li>Use the Services to facilitate illegal activities or money laundering.</li>
              <li>Reverse engineer, decompile, or disassemble any platform components.</li>
              <li>Harvest or collect user data without explicit consent (GDPR violation).</li>
              <li>Send unsolicited marketing communications to end-user customers.</li>
              <li>Manipulate loyalty points, stamps, or rewards through unauthorized means.</li>
            </ul>

            <h2 id="section3">SUBSCRIPTIONS</h2>
            <p>If you subscribe to our Services, you understand, acknowledge, and agree that you may not, except if expressly permitted:</p>
            <ul>
              <li>Engage in any use, including modification, copying, redistribution, publication, display, performance, or retransmission, of any portions of any Services, other than as expressly permitted by this Policy, without the prior written consent of LoyalCard, which consent LoyalCard may grant or refuse in its sole and absolute discretion.</li>
              <li>Reconstruct or attempt to discover any source code or algorithms of the Services, or any portion thereof, by any means whatsoever.</li>
              <li>Provide, or otherwise make available, the Services to any third party.</li>
              <li>Intercept any data not intended for you.</li>
              <li>Damage, reveal, or alter any user's data, or any other hardware, software, or information relating to another person or entity.</li>
              <li>Send spam or unsolicited messages to end-user customers.</li>
              <li>Create fake scans or manipulate loyalty points/stamps.</li>
              <li>Use multiple accounts to avoid subscription payments.</li>
              <li>Upload illegal, offensive, or inappropriate business content.</li>
              <li>Resell or redistribute access to the platform.</li>
              <li>Scrape or harvest data from other merchants or customers.</li>
              <li>Attempt to overload or attack the platform infrastructure.</li>
              <li>Impersonate other businesses or create fraudulent loyalty programs.</li>
              <li>Violate GDPR or customer privacy rights.</li>
            </ul>

            <h2 id="section4">CONSEQUENCES OF BREACHING THIS POLICY</h2>
            <p>The consequences for violating our Policy will vary depending on the severity of the breach and the user's history on the Services, by way of example:</p>
            <p>We may, in some cases, give you a warning, however, if your breach is serious or if you continue to breach our Legal Terms and this Policy, we have the right to suspend or terminate your access to and use of our Services and, if applicable, disable your account. We may also notify law enforcement or issue legal proceedings against you when we believe that there is a genuine risk to an individual or a threat to public safety.</p>
            <p>We exclude our liability for all action we may take in response to any of your breaches of this Policy.</p>

            <h2 id="section5">HOW CAN YOU CONTACT US ABOUT THIS POLICY?</h2>
            <p>If you have any further questions or comments, you may contact us by:</p>
            <p>
              <strong>Online contact form:</strong> <a href="/contact">https://loyalcard.net/contact</a><br />
              <strong>Email:</strong> <a href="mailto:eduardgavril.1999@gmail.com">eduardgavril.1999@gmail.com</a><br />
              <strong>Company:</strong> LoyalCard<br />
              <strong>Address:</strong> Aleea Petru Rares, Targu Frumos, Iasi, Romania 705300<br />
              <strong>Phone:</strong> +40 750 438 655
            </p>

            <hr className="my-8" />

            <p className="text-sm text-gray-600">
              This Acceptable Use Policy was created using Termly's Acceptable Use Policy Generator and customized for LoyalCard SaaS platform.
            </p>

          </div>
        </div>
      </main>
    </div>
  )
}
