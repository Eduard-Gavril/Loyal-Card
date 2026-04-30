import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose prose-blue max-w-none text-gray-900">
            <p className="text-sm text-gray-500 mb-6">
              <strong>Last updated:</strong> April 26, 2026
            </p>

            <p>
              This Privacy Notice for LoyalCard ('we', 'us', or 'our'), describes how and why we might access, 
              collect, store, use, and/or share ('process') your personal information when you use our services 
              ('Services'), including when you:
            </p>

            <ul>
              <li>Visit our website at <a href="https://loyalcard.net" className="text-primary-600 hover:text-primary-700">https://loyalcard.net</a> or any website of ours that links to this Privacy Notice</li>
              <li>Use LoyalCard. LoyalCard is a multi-tenant Software-as-a-Service (SaaS) platform that provides digital loyalty program management for businesses of all sizes. Our platform enables merchants to: Create product-based loyalty programs (e.g., "buy 5 coffees, get 1 free"), Issue digital QR-code loyalty cards to customers, Scan and track customer purchases in real-time, Manage multiple reward tiers and product categories, Access analytics and reports on customer engagement, Customize branding with white-label options (on paid plans). Customers receive instant digital loyalty cards without registration or app downloads. When making purchases, they simply show their QR code for staff to scan, automatically tracking their loyalty progress. We offer tiered subscription plans from €0/month (Starter) to €149/month (Enterprise), with features scaling based on number of locations, active customers, and advanced functionality.</li>
              <li>Engage with us in other related ways, including any marketing or events</li>
            </ul>

            <p>
              <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy 
              rights and choices. We are responsible for making decisions about how your personal information is processed. 
              If you do not agree with our policies and practices, please do not use our Services. If you still have any 
              questions or concerns, please contact us at <a href="mailto:eduardgavril.1999@gmail.com" className="text-primary-600 hover:text-primary-700">eduardgavril.1999@gmail.com</a>.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">SUMMARY OF KEY POINTS</h2>

            <p className="italic">
              This summary provides key points from our Privacy Notice, but you can find out more details about any 
              of these topics by clicking the link following each key point or by using our table of contents below to 
              find the section you are looking for.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.</p>
              
              <p><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
              
              <p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
              
              <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.</p>
              
              <p><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.</p>
              
              <p><strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about how we keep your information safe.</p>
              
              <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about your privacy rights.</p>
              
              <p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by visiting <a href="https://loyalcard.net/contact" className="text-primary-600 hover:text-primary-700">https://loyalcard.net/contact</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>
            </div>

            <p>Want to learn more about what we do with any information we collect? Review the Privacy Notice in full.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">TABLE OF CONTENTS</h2>

            <ol className="list-decimal list-inside space-y-2">
              <li><a href="#section1" className="text-primary-600 hover:text-primary-700">WHAT INFORMATION DO WE COLLECT?</a></li>
              <li><a href="#section2" className="text-primary-600 hover:text-primary-700">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
              <li><a href="#section3" className="text-primary-600 hover:text-primary-700">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
              <li><a href="#section4" className="text-primary-600 hover:text-primary-700">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
              <li><a href="#section5" className="text-primary-600 hover:text-primary-700">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
              <li><a href="#section6" className="text-primary-600 hover:text-primary-700">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
              <li><a href="#section7" className="text-primary-600 hover:text-primary-700">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
              <li><a href="#section8" className="text-primary-600 hover:text-primary-700">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
              <li><a href="#section9" className="text-primary-600 hover:text-primary-700">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
              <li><a href="#section10" className="text-primary-600 hover:text-primary-700">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
              <li><a href="#section11" className="text-primary-600 hover:text-primary-700">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
            </ol>

            <h2 id="section1" className="text-2xl font-bold mt-8 mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">Personal information you disclose to us</h3>

            <p><em>In Short: We collect personal information that you provide to us.</em></p>

            <p>
              We collect personal information that you voluntarily provide to us when you register on the Services, 
              express an interest in obtaining information about us or our products and Services, when you participate 
              in activities on the Services, or otherwise when you contact us.
            </p>

            <p>
              <strong>Personal Information Provided by You.</strong> The personal information that we collect depends 
              on the context of your interactions with us and the Services, the choices you make, and the products and 
              features you use. The personal information we collect may include the following:
            </p>

            <ul>
              <li>names</li>
              <li>phone numbers</li>
              <li>email addresses</li>
              <li>passwords</li>
              <li>usernames</li>
              <li>contact or authentication data</li>
            </ul>

            <p><strong>Sensitive Information.</strong> We do not process sensitive information.</p>

            <p>
              All personal information that you provide to us must be true, complete, and accurate, and you must notify 
              us of any changes to such personal information.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Information automatically collected</h3>

            <p>
              <em>In Short: Some information — such as your Internet Protocol (IP) address and/or browser and device 
              characteristics — is collected automatically when you visit our Services.</em>
            </p>

            <p>
              We automatically collect certain information when you visit, use, or navigate the Services. This information 
              does not reveal your specific identity (like your name or contact information) but may include device and 
              usage information, such as your IP address, browser and device characteristics, operating system, language 
              preferences, referring URLs, device name, country, location, information about how and when you use our 
              Services, and other technical information. This information is primarily needed to maintain the security and 
              operation of our Services, and for our internal analytics and reporting purposes.
            </p>

            <p>
              Like many businesses, we also collect information through cookies and similar technologies. You can find out 
              more about this in our Cookie Notice: <a href="https://loyalcard.net/cookie-policy" className="text-primary-600 hover:text-primary-700">https://loyalcard.net/cookie-policy</a>.
            </p>

            <p>The information we collect includes:</p>

            <ul>
              <li>
                <strong>Log and Usage Data.</strong> Log and usage data is service-related, diagnostic, usage, and performance 
                information our servers automatically collect when you access or use our Services and which we record in log 
                files. Depending on how you interact with us, this log data may include your IP address, device information, 
                browser type, and settings and information about your activity in the Services (such as the date/time stamps 
                associated with your usage, pages and files viewed, searches, and other actions you take such as which features 
                you use), device event information (such as system activity, error reports (sometimes called 'crash dumps'), 
                and hardware settings).
              </li>
              <li>
                <strong>Device Data.</strong> We collect device data such as information about your computer, phone, tablet, 
                or other device you use to access the Services. Depending on the device used, this device data may include 
                information such as your IP address (or proxy server), device and application identification numbers, location, 
                browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system 
                configuration information.
              </li>
              <li>
                <strong>Location Data.</strong> We collect location data such as information about your device's location, 
                which can be either precise or imprecise. How much information we collect depends on the type and settings of 
                the device you use to access the Services. For example, we may use GPS and other technologies to collect 
                geolocation data that tells us your current location (based on your IP address). You can opt out of allowing 
                us to collect this information either by refusing access to the information or by disabling your Location 
                setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the 
                Services.
              </li>
            </ul>

            <h2 id="section2" className="text-2xl font-bold mt-8 mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>

            <p>
              <em>In Short: We process your information to provide, improve, and administer our Services, communicate with 
              you, for security and fraud prevention, and to comply with law. We may also process your information for other 
              purposes with your consent.</em>
            </p>

            <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>

            <ul>
              <li>
                <strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may 
                process your information so you can create and log in to your account, as well as keep your account in working 
                order.
              </li>
              <li>
                <strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information 
                to provide you with the requested service.
              </li>
              <li>
                <strong>To respond to user inquiries/offer support to users.</strong> We may process your information to 
                respond to your inquiries and solve any potential issues you might have with the requested service.
              </li>
              <li>
                <strong>To send administrative information to you.</strong> We may process your information to send you details 
                about our products and services, changes to our terms and policies, and other similar information.
              </li>
              <li>
                <strong>To fulfil and manage your orders.</strong> We may process your information to fulfil and manage your 
                orders, payments, returns, and exchanges made through the Services.
              </li>
              <li>
                <strong>To send you marketing and promotional communications.</strong> We may process the personal information 
                you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can 
                opt out of our marketing emails at any time. For more information, see 'WHAT ARE YOUR PRIVACY RIGHTS?' below.
              </li>
              <li>
                <strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our 
                Services safe and secure, including fraud monitoring and prevention.
              </li>
              <li>
                <strong>To evaluate and improve our Services, products, marketing, and your experience.</strong> We may process 
                your information when we believe it is necessary to identify usage trends, determine the effectiveness of our 
                promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.
              </li>
              <li>
                <strong>To identify usage trends.</strong> We may process information about how you use our Services to better 
                understand how they are being used so we can improve them.
              </li>
              <li>
                <strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your 
                information to better understand how to provide marketing and promotional campaigns that are most relevant to you.
              </li>
              <li>
                <strong>To comply with our legal obligations.</strong> We may process your information to comply with our legal 
                obligations, respond to legal requests, and exercise, establish, or defend our legal rights.
              </li>
            </ul>

            <h2 id="section3" className="text-2xl font-bold mt-8 mb-4">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>

            <p>
              <em>In Short: We may share information in specific situations described in this section and/or with the 
              following third parties.</em>
            </p>

            <p>We may need to share your personal information in the following situations:</p>

            <ul>
              <li>
                <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during 
                negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our 
                business to another company.
              </li>
              <li>
                <strong>Business Partners.</strong> We may share your information with our business partners to offer you 
                certain products, services, or promotions.
              </li>
            </ul>

            <h2 id="section4" className="text-2xl font-bold mt-8 mb-4">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>

            <p>
              <em>In Short: We may use cookies and other tracking technologies to collect and store your information.</em>
            </p>

            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when 
              you interact with our Services. Some online tracking technologies help us maintain the security of our Services 
              and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
            </p>

            <p>
              We also permit third parties and service providers to use online tracking technologies on our Services for 
              analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your 
              interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third 
              parties and service providers use their technology to provide advertising about products and services tailored 
              to your interests which may appear either on our Services or on other websites.
            </p>

            <p>
              Specific information about how we use such technologies and how you can refuse certain cookies is set out in our 
              Cookie Notice: <a href="https://loyalcard.net/cookie-policy" className="text-primary-600 hover:text-primary-700">https://loyalcard.net/cookie-policy</a>.
            </p>

            <h2 id="section5" className="text-2xl font-bold mt-8 mb-4">5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>

            <p>
              <em>In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy 
              Notice unless otherwise required by law.</em>
            </p>

            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this 
              Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or 
              other legal requirements). No purpose in this notice will require us keeping your personal information for longer 
              than the period of time in which users have an account with us.
            </p>

            <p>
              When we have no ongoing legitimate business need to process your personal information, we will either delete or 
              anonymise such information, or, if this is not possible (for example, because your personal information has been 
              stored in backup archives), then we will securely store your personal information and isolate it from any further 
              processing until deletion is possible.
            </p>

            <h2 id="section6" className="text-2xl font-bold mt-8 mb-4">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>

            <p>
              <em>In Short: We aim to protect your personal information through a system of organisational and technical 
              security measures.</em>
            </p>

            <p>
              We have implemented appropriate and reasonable technical and organisational security measures designed to protect 
              the security of any personal information we process. However, despite our safeguards and efforts to secure your 
              information, no electronic transmission over the Internet or information storage technology can be guaranteed to 
              be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third 
              parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. 
              Although we will do our best to protect your personal information, transmission of personal information to and 
              from our Services is at your own risk. You should only access the Services within a secure environment.
            </p>

            <h2 id="section7" className="text-2xl font-bold mt-8 mb-4">7. WHAT ARE YOUR PRIVACY RIGHTS?</h2>

            <p>
              <em>In Short: You may review, change, or terminate your account at any time, depending on your country, province, 
              or state of residence.</em>
            </p>

            <p>
              <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, 
              which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your 
              consent at any time. You can withdraw your consent at any time by contacting us by using the contact details 
              provided in the section 'HOW CAN YOU CONTACT US ABOUT THIS NOTICE?' below.
            </p>

            <p>
              However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when 
              applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful 
              processing grounds other than consent.
            </p>

            <p>
              <strong>Opting out of marketing and promotional communications:</strong> You can unsubscribe from our marketing 
              and promotional communications at any time by or by contacting us using the details provided in the section 'HOW 
              CAN YOU CONTACT US ABOUT THIS NOTICE?' below. You will then be removed from the marketing lists. However, we may 
              still communicate with you — for example, to send you service-related messages that are necessary for the 
              administration and use of your account, to respond to service requests, or for other non-marketing purposes.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>

            <p>If you would at any time like to review or change the information in your account or terminate your account, you can:</p>

            <ul>
              <li>Contact us using the contact information provided.</li>
            </ul>

            <p>
              Upon your request to terminate your account, we will deactivate or delete your account and information from our 
              active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, 
              assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
            </p>

            <p>
              <strong>Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default. If you 
              prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to 
              remove cookies or reject cookies, this could affect certain features or services of our Services. For further 
              information, please see our Cookie Notice: <a href="https://loyalcard.net/cookie-policy" className="text-primary-600 hover:text-primary-700">https://loyalcard.net/cookie-policy</a>.
            </p>

            <p>
              If you have questions or comments about your privacy rights, you may email us at{' '}
              <a href="mailto:eduardgavril.1999@gmail.com" className="text-primary-600 hover:text-primary-700">eduardgavril.1999@gmail.com</a>.
            </p>

            <h2 id="section8" className="text-2xl font-bold mt-8 mb-4">8. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>

            <p>
              Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ('DNT') feature 
              or setting you can activate to signal your privacy preference not to have data about your online browsing 
              activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing 
              DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism 
              that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted 
              that we must follow in the future, we will inform you about that practice in a revised version of this Privacy 
              Notice.
            </p>

            <h2 id="section9" className="text-2xl font-bold mt-8 mb-4">9. DO WE MAKE UPDATES TO THIS NOTICE?</h2>

            <p>
              <em>In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</em>
            </p>

            <p>
              We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Revised' 
              date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you 
              either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you 
              to review this Privacy Notice frequently to be informed of how we are protecting your information.
            </p>

            <h2 id="section10" className="text-2xl font-bold mt-8 mb-4">10. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>

            <p>If you have questions or comments about this notice, you may email us at <a href="mailto:eduardgavril.1999@gmail.com" className="text-primary-600 hover:text-primary-700">eduardgavril.1999@gmail.com</a> or contact us by post at:</p>

            <address className="not-italic">
              <strong>LoyalCard</strong><br />
              aleea petru rares<br />
              targu frumos, iasi - romania 705300<br />
              Romania
            </address>

            <h2 id="section11" className="text-2xl font-bold mt-8 mb-4">11. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>

            <p>
              Based on the applicable laws of your country, you may have the right to request access to the personal information 
              we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal 
              information. You may also have the right to withdraw your consent to our processing of your personal information. 
              These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your 
              personal information, please visit: <a href="https://loyalcard.net/contact" className="text-primary-600 hover:text-primary-700">https://loyalcard.net/contact</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
