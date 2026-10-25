import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, ShieldCheck, Truck, Clock, HelpCircle, Phone, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#0B1220] border-t border-slate-200/80 dark:border-[#2D3748] text-slate-600 dark:text-[#A7B3C5] transition-colors">
      {/* Feature Highlights Row */}
      <div className="border-b border-slate-100 dark:border-[#2D3748] bg-slate-50/70 dark:bg-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB]">Hyperlocal Delivery</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Direct from shops in your neighborhood</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-emerald-100 dark:bg-[#12352D] text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB]">100% Quality Assured</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Handpicked farm-fresh veggies & groceries</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB]">Swift Doorstep Pickup</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Fast fulfillment or convenient pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                <HelpCircle size={22} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F9FAFB]">Dedicated Support</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#A7B3C5] mt-0.5">Friendly assistance 7 AM - 9 PM daily</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 dark:text-[#F9FAFB] tracking-tight leading-none">
                  Local<span className="text-emerald-600 dark:text-[#34D399]">Grocery</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-[#A7B3C5] font-semibold tracking-wide mt-0.5">
                  Fresh • Local • Together
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A7B3C5] leading-relaxed max-w-sm">
              Connecting local grocery stores directly with customers for fast, affordable, and fresh doorstep deliveries across Pollachi and Coimbatore districts.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A7B3C5] font-medium pt-1">
              <MapPin size={15} className="text-emerald-600 dark:text-[#34D399] shrink-0" />
              <span>Pollachi & Coimbatore, Tamil Nadu, India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-[#F9FAFB]">Quick Links</h5>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/shops" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Explore Shops</Link>
              </li>
              <li>
                <Link to="/favourites" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">My Favourites</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Order History</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-[#F9FAFB]">Customer Care</h5>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link to="/help" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Help & Support</Link>
              </li>
              <li>
                <Link to="/help#faq" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/help#cancellation" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Order Cancellation & Refund</Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">My Account & Addresses</Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors">Preferences & Notifications</Link>
              </li>
            </ul>
          </div>

          {/* Merchant & Contact */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-[#F9FAFB]">Contact & Business</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center gap-2 text-slate-600 dark:text-[#A7B3C5]">
                <Phone size={14} className="text-emerald-600 dark:text-[#34D399] shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-[#A7B3C5]">
                <Mail size={14} className="text-emerald-600 dark:text-[#34D399] shrink-0" />
                <span>support@localgrocery.in</span>
              </li>
              <li className="pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#172033] hover:bg-emerald-50 dark:hover:bg-[#12352D] hover:text-emerald-600 dark:hover:text-[#34D399] text-slate-800 dark:text-[#F9FAFB] text-xs font-bold transition-all border border-transparent dark:border-[#2D3748]"
                >
                  <ShoppingBag size={13} />
                  <span>Register as Shop Owner</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-[#2D3748] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-[#A7B3C5]">
          <p>© {new Date().getFullYear()} LocalGrocery Booking System. All rights reserved.</p>
          <div className="flex items-center gap-6 font-semibold">
            <Link to="/help" className="hover:text-slate-600 dark:hover:text-[#F9FAFB] transition-colors">Privacy Policy</Link>
            <Link to="/help" className="hover:text-slate-600 dark:hover:text-[#F9FAFB] transition-colors">Terms of Service</Link>
            <span className="flex items-center gap-1 text-slate-500 dark:text-[#A7B3C5]">
              Made with <Heart size={12} className="text-red-500 fill-red-500" /> for local communities
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
