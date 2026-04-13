import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, MessageCircle, Camera, Play } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-navy text-white">
      {/* Main Footer */}
      <div className="base-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="text-2xl font-bold text-primary-green mb-4 inline-block">FreshCart</Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Your one-stop destination for farm-fresh groceries delivered to your doorstep. Shop from multiple local stores with ease.
            </p>
            <div className="flex gap-3">
              {[Globe, MessageCircle, Camera, Play].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary-green transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 mt-0">Quick Links</h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {[
                { to: '/shop', label: 'All Products' },
                { to: '/deals', label: 'Deals & Offers' },
                { to: '/stores', label: 'Our Stores' },
                { to: '/categories', label: 'Categories' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-primary-green transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-white mb-4 mt-0">Customer Service</h4>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {['Help Center', 'Track Order', 'Shipping Info', 'Returns & Refunds', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-primary-green transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 mt-0">Contact Us</h4>
            <div className="space-y-3">
              <p className="text-sm text-gray-400 flex items-start gap-2 m-0">
                <MapPin size={16} className="mt-0.5 text-primary-green flex-shrink-0" />
                456 Market Street, New York, NY 10001
              </p>
              <p className="text-sm text-gray-400 flex items-center gap-2 m-0">
                <Phone size={16} className="text-primary-green flex-shrink-0" />
                +1 (212) 555-CART
              </p>
              <p className="text-sm text-gray-400 flex items-center gap-2 m-0">
                <Mail size={16} className="text-primary-green flex-shrink-0" />
                support@freshcart.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="base-container py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500 m-0">&copy; {new Date().getFullYear()} FreshCart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">We accept:</span>
            <div className="flex gap-2 text-lg">
              <span>💳</span>
              <span>🏦</span>
              <span>💵</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
