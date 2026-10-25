import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Phone,
  Mail,
  Clock,
  MapPin,
  ChevronDown,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Package,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

interface FAQItem {
  question: string;
  answer: string;
  category: 'orders' | 'delivery' | 'cancellation' | 'payments';
}

const FAQS: FAQItem[] = [
  {
    category: 'orders',
    question: 'How do I place an order with a local grocery shop?',
    answer:
      'Select your delivery locality or use GPS to view shops serving your area. Browse items from a single shop, add groceries to your cart, confirm your address, and place your Cash on Delivery order.',
  },
  {
    category: 'orders',
    question: 'Can I order from multiple shops in a single checkout?',
    answer:
      'To ensure prompt and fresh delivery, each order is fulfilled by a single merchant. If you add items from a second shop, the app will ask whether you want to clear your current cart or continue with the initial store.',
  },
  {
    category: 'cancellation',
    question: 'How do I cancel my order?',
    answer:
      'You can cancel your order directly from the "My Orders" page as long as the status is "Placed". Once the merchant marks the order as "Preparing" or "Out for Delivery", please contact the shop or our customer support immediately to request cancellation.',
  },
  {
    category: 'cancellation',
    question: 'What is the refund policy for Cash on Delivery orders?',
    answer:
      'Since orders are paid via Cash on Delivery, you only pay when your groceries are inspected and delivered to your doorstep. If any item is damaged or missing upon arrival, you can reject the specific item or notify the delivery person directly.',
  },
  {
    category: 'delivery',
    question: 'What are the delivery hours in Pollachi and Coimbatore?',
    answer:
      'Store hours vary by merchant, but standard grocery deliveries run from 7:00 AM to 9:00 PM daily. Check each shop card for real-time "Open / Closed" badges.',
  },
  {
    category: 'payments',
    question: 'What payment methods are supported?',
    answer:
      'We currently prioritize Cash on Delivery (COD) and UPI upon doorstep delivery. You pay safely only after verifying the quality of your fresh vegetables and groceries.',
  },
];

export const HelpSupport = () => {
  const { user } = useAuthStore();

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [issueType, setIssueType] = useState('Order Issue');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');

  // Prefill details if user is signed in
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const filteredFaqs = FAQS.filter(
    (faq) => selectedCategory === 'all' || faq.category === selectedCategory
  );

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const generatedTicketId = `LG-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedTicketId);
      
      try {
        const existing = JSON.parse(localStorage.getItem('localgrocery_support_tickets') || '[]');
        existing.unshift({
          ticketId: generatedTicketId,
          name: name.trim(),
          email: email.trim(),
          orderNumber: orderNumber.trim() || undefined,
          issueType,
          message: message.trim(),
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('localgrocery_support_tickets', JSON.stringify(existing.slice(0, 5)));
      } catch (err) {
        console.error(err);
      }

      setSubmitting(false);
      setSubmitted(true);
      toast.success(`Inquiry submitted! Ticket #${generatedTicketId}`);
    }, 600);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
            <HelpCircle size={14} /> LocalGrocery Support Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-[#F9FAFB] tracking-tight">
            How can we assist you today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] leading-relaxed">
            Find quick answers to common queries, understand our cancellation policies, or contact our customer support team directly.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="tel:+919876543210"
            className="p-5 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:shadow-md transition-all flex items-start gap-4 group cursor-pointer"
          >
            <div className="h-11 w-11 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5]">Phone Support</h4>
              <p className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">+91 98765 43210</p>
              <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Mon - Sun: 7:00 AM - 9:00 PM</p>
            </div>
          </a>

          <a
            href="mailto:support@localgrocery.in"
            className="p-5 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-emerald-300 dark:hover:border-emerald-600/50 hover:shadow-md transition-all flex items-start gap-4 group cursor-pointer"
          >
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5]">Email Inquiries</h4>
              <p className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">support@localgrocery.in</p>
              <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Typically replies within 2 hours</p>
            </div>
          </a>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#2D3748] hover:border-purple-300 dark:hover:border-purple-600/50 hover:shadow-md transition-all flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-[#A7B3C5]">Main Office</h4>
              <p className="text-sm font-black text-slate-900 dark:text-[#F9FAFB] mt-0.5">Market Road, Pollachi</p>
              <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Coimbatore Dist, Tamil Nadu - 642001</p>
            </div>
          </div>
        </div>

        {/* Order Cancellation Guidelines Box */}
        <div id="cancellation" className="p-6 sm:p-8 rounded-3xl bg-emerald-50/50 dark:bg-[#12352D]/40 border border-emerald-200/80 dark:border-[#2D3748]">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <RotateCcw size={22} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-[#F9FAFB]">
                  Order Cancellation & Doorstep Quality Guarantee
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A7B3C5] leading-relaxed max-w-2xl">
                  We believe in hassle-free local grocery shopping. Here is how cancellations and returns work:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-700 dark:text-[#F9FAFB] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
                    <strong>Instant Cancellation:</strong> Free cancellation while order is in "Placed" status.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
                    <strong>Inspection at Doorstep:</strong> Verify fresh veggies & dairy before paying COD.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
                    <strong>No Hidden Penalties:</strong> Zero cancellation fees on rejected damaged products.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
                    <strong>Direct Merchant Connection:</strong> Shop phone number is on every order receipt.
                  </li>
                </ul>
              </div>
            </div>

            <Link
              to="/orders"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <span>Manage My Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* FAQs and Contact Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FAQ Accordion (7 cols) */}
          <div id="faq" className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-[#F9FAFB]">Frequently Asked Questions</h3>
                <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mt-0.5">Quick answers to common questions</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: 'all', label: 'All FAQs' },
                { id: 'orders', label: 'Orders' },
                { id: 'cancellation', label: 'Cancellations' },
                { id: 'delivery', label: 'Delivery' },
                { id: 'payments', label: 'Payments' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#172033] border border-slate-200 dark:border-[#2D3748] text-slate-600 dark:text-[#A7B3C5] hover:bg-slate-50 dark:hover:bg-[#111827]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* FAQ List */}
            <div className="space-y-3 pt-2">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={faq.question}
                    className="border border-slate-200/80 dark:border-[#2D3748] rounded-2xl bg-white dark:bg-[#172033] overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-[#F9FAFB] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 dark:text-[#A7B3C5] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-[#A7B3C5] leading-relaxed border-t border-slate-100 dark:border-[#2D3748]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Contact Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#172033] rounded-3xl border border-slate-200/80 dark:border-[#2D3748] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <MessageSquare size={18} />
                <h3 className="text-base font-black text-slate-900 dark:text-[#F9FAFB]">Send us a message</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A7B3C5] mb-5">
                Our support desk will respond via email within 2-4 hours.
              </p>

              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-[#F9FAFB]">Inquiry Received!</h4>
                  {ticketId && (
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F9FAFB] border dark:border-[#2D3748] text-xs font-mono font-bold">
                      Reference #{ticketId}
                    </span>
                  )}
                  <p className="text-xs text-slate-500 dark:text-[#A7B3C5] leading-relaxed max-w-xs mx-auto">
                    Thank you, {name}. A support ticket has been recorded and our team will get in touch shortly via {email}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. anand@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">Order # (Optional)</label>
                      <input
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="e.g. ORD-1024"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">Topic</label>
                      <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-bold text-slate-700 dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Order Issue">Order Issue</option>
                        <option value="Delivery Delay">Delivery Delay</option>
                        <option value="Product Quality">Product Quality</option>
                        <option value="Shop Inquiry">Shop Inquiry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#F9FAFB] mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or feedback in detail..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2D3748] bg-white dark:bg-[#111827] text-xs font-semibold text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} /> {submitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HelpSupport;
