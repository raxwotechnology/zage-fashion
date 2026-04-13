import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { registerUser } from '../services/api';
import { toast } from 'react-toastify';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerUser({ name, email, password, phone });
      login(data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-orange-50 py-12">
      <motion.div
        className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-card-border w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary-green inline-block mb-4">FreshCart</Link>
          <h1 className="text-2xl font-bold text-dark-navy mt-0 mb-2">Create Account</h1>
          <p className="text-muted-text m-0">Join FreshCart for fresh groceries</p>
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1.5" htmlFor="reg-name">
              Full Name
            </label>
            <input
              type="text"
              id="reg-name"
              className="w-full border border-card-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1.5" htmlFor="reg-email">
              Email Address
            </label>
            <input
              type="email"
              id="reg-email"
              className="w-full border border-card-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1.5" htmlFor="reg-phone">
              Phone Number
            </label>
            <input
              type="tel"
              id="reg-phone"
              className="w-full border border-card-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-navy mb-1.5" htmlFor="reg-password">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="reg-password"
                className="w-full border border-card-border rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-primary-green focus:border-transparent outline-none transition-all"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-dark-navy"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-green text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-text">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-green font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
