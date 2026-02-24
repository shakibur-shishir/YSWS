import { createContext, useContext, useState, useEffect, ReactNode, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, AuthContextType } from './types';
import { LogOut, User as UserIcon, Bell, Shield, Menu, X, Home as HomeIcon, Info, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await window.fetch('/api/auth/me');
      if (res.ok) {
        const data = res.ok ? await res.json() : null;
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: User) => setUser(userData);
  const logout = async () => {
    await window.fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  const authLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: Bell },
    { name: 'Profile', path: '/dashboard/profile', icon: UserIcon },
    ...(user.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ] : [
    { name: 'Login', path: '/login' },
    { name: 'Join Us', path: '/register', primary: true },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-black/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="font-bold text-xl tracking-tight">OrgMinimal</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-black",
                  location.pathname === link.path ? "text-black" : "text-black/50"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-4 w-px bg-black/10 mx-2" />
            {user ? (
              <div className="flex items-center space-x-6">
                {authLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-black",
                      location.pathname === link.path ? "text-black" : "text-black/50"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
                <button onClick={logout} className="text-black/50 hover:text-black transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-black/50 hover:text-black">Login</Link>
                <Link to="/register" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-black/80 transition-colors">Join Us</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-black/5 px-4 py-6 space-y-4"
          >
            {[...navLinks, ...authLinks].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-black/70 hover:text-black"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <button onClick={logout} className="flex items-center space-x-2 text-lg font-medium text-red-500">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-black/5 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-bold text-lg">OrgMinimal</span>
          </div>
          <p className="text-black/50 text-sm max-w-xs">
            A minimal organization dedicated to excellence and community growth.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Links</h4>
          <ul className="space-y-2 text-sm text-black/50">
            <li><Link to="/" className="hover:text-black">Home</Link></li>
            <li><Link to="/about" className="hover:text-black">About</Link></li>
            <li><Link to="/contact" className="hover:text-black">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-black/50">
            <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-black">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-black/5 text-center text-xs text-black/30">
        © {new Date().getFullYear()} OrgMinimal. All rights reserved.
      </div>
    </div>
  </footer>
);

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
    <Navbar />
    <main className="flex-grow pt-16">
      {children}
    </main>
    <Footer />
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

// --- Pages ---

const Home = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-3xl mx-auto"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-black/40 mb-4 block">Welcome to OrgMinimal</span>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-8">
        Simplicity in <span className="italic font-serif">Organization</span>
      </h1>
      <p className="text-xl text-black/50 mb-12 leading-relaxed">
        We believe that the best organizations are built on clarity, transparency, and minimal overhead. Join our community today.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-black/80 transition-all transform hover:scale-105">
          Join the Organization
        </Link>
        <Link to="/about" className="w-full sm:w-auto px-8 py-4 border border-black/10 rounded-full font-bold hover:bg-black/5 transition-all">
          Learn More
        </Link>
      </div>
    </motion.div>

    <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
      {[
        { title: "Our Mission", desc: "To provide a clean and efficient platform for community collaboration." },
        { title: "Our Vision", desc: "A world where every organization can focus on their core goals without distraction." },
        { title: "Our Values", desc: "Clarity, Integrity, and Community-first approach in everything we do." }
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-8 bg-white rounded-2xl border border-black/5 shadow-sm"
        >
          <h3 className="text-xl font-bold mb-4">{item.title}</h3>
          <p className="text-black/50 leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-24">
    <h1 className="text-4xl font-bold mb-8">About Us</h1>
    <div className="prose prose-lg text-black/70 space-y-6">
      <p>Founded in 2026, OrgMinimal started as a small group of individuals who were tired of complex, cluttered organizational structures. We wanted something better—something minimal.</p>
      <p>Our philosophy is simple: remove the noise, focus on the signal. We provide the tools and the community for people to get things done together, without the unnecessary fluff.</p>
      <h2 className="text-2xl font-bold text-black mt-12">Our History</h2>
      <p>What began as a simple internal tool evolved into a full-fledged platform for organizations worldwide. We've helped hundreds of groups streamline their communication and management.</p>
    </div>
  </div>
);

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="max-w-xl mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-black/50 mb-12">Have questions? We'd love to hear from you.</p>
      {submitted ? (
        <div className="p-8 bg-green-50 text-green-700 rounded-2xl border border-green-100">
          Thank you! Your message has been sent.
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
          <div>
            <label className="block text-sm font-bold mb-2">Full Name</label>
            <input type="text" required className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Email Address</label>
            <input type="email" required className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Message</label>
            <textarea required rows={5} className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5" />
          </div>
          <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-colors">
            Send Message
          </button>
        </form>
      )}
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await window.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
        <p className="text-black/40 text-center mb-8">Login to your member account</p>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
          </div>
          <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/10">
            Login
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-black/40">
          Don't have an account? <Link to="/register" className="text-black font-bold hover:underline">Join Us</Link>
        </p>
      </div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const batches = Array.from({ length: 15 }, (_, i) => (14 + i).toString());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await window.fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, batch: parseInt(batch) }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Join Us</h1>
        <p className="text-black/40 text-center mb-8">Create your organization account</p>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Batch Number</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all">
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
          </div>
          <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/10">
            Create Account
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-black/40">
          Already a member? <Link to="/login" className="text-black font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    window.fetch('/api/announcements').then(res => res.json()).then(setAnnouncements);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Hello, {user?.name}</h1>
        <p className="text-black/40">Welcome to your dashboard. Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5" /> Announcements
              </h2>
            </div>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/5 text-black/30">
                  No announcements yet.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{ann.title}</h3>
                      <span className="text-xs text-black/30">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-black/60 leading-relaxed">{ann.content}</p>
                    <div className="mt-4 pt-4 border-t border-black/5 text-xs text-black/40">
                      Posted by {ann.author_name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-black text-white p-8 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Role</span>
                <span className="font-mono uppercase text-xs bg-white/10 px-2 py-1 rounded">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Joined</span>
                <span className="text-sm">{user ? new Date(user.created_at).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-black/5">
            <h3 className="text-lg font-bold mb-4">Community</h3>
            <p className="text-sm text-black/50 mb-6">Connect with other members of the organization.</p>
            <Link to="/dashboard/members" className="block w-full text-center py-3 border border-black/10 rounded-xl text-sm font-bold hover:bg-black/5 transition-all">
              View Directory
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [social, setSocial] = useState(user?.social_links || '');
  const [batch, setBatch] = useState(user?.batch?.toString() || '');
  const [message, setMessage] = useState('');

  const batches = Array.from({ length: 15 }, (_, i) => (14 + i).toString());

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await window.fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, phone, social_links: social, batch: parseInt(batch) }),
    });
    if (res.ok) {
      setMessage('Profile updated successfully!');
      refreshUser();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      {message && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}
      <form onSubmit={handleUpdate} className="space-y-6 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Batch Number</label>
          <select value={batch} onChange={(e) => setBatch(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all">
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Phone</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Social Links</label>
          <input type="text" value={social} onChange={(e) => setSocial(e.target.value)} placeholder="Twitter, LinkedIn, etc." className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
        </div>
        <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all">
          Save Changes
        </button>
      </form>
    </div>
  );
};

const MembersDirectory = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    window.fetch('/api/members').then(res => res.json()).then(setMembers);
  }, []);

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Members Directory</h1>
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search members by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm text-center">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-black/20" />
            </div>
            <h3 className="font-bold">{member.name}</h3>
            <p className="text-xs text-black/30 uppercase tracking-widest mb-1">{member.role}</p>
            <p className="text-xs font-mono bg-black/5 px-2 py-0.5 rounded inline-block mb-2">Batch {member.batch}</p>
            <p className="text-sm text-black/50 line-clamp-2">{member.bio || 'No bio provided'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [message, setMessage] = useState('');

  const getMembers = () => {
    window.fetch('/api/admin/members').then(res => res.json()).then(setMembers);
  };

  useEffect(() => {
    getMembers();
  }, []);

  const exportToExcel = () => {
    const data = members.map(m => ({
      ID: m.id,
      Name: m.name,
      Email: m.email,
      Role: m.role,
      Batch: m.batch,
      Phone: m.phone || 'N/A',
      Bio: m.bio || 'N/A',
      'Social Links': m.social_links || 'N/A',
      'Joined At': new Date(m.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "Organization_Members.xlsx");
  };

  const handleCreateAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    const res = await window.fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: annTitle, content: annContent }),
    });
    if (res.ok) {
      setMessage('Announcement posted!');
      setAnnTitle('');
      setAnnContent('');
    }
  };

  const updateRole = async (id: number, role: string) => {
    await window.fetch(`/api/admin/members/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    getMembers();
  };

  const deleteMember = async (id: number) => {
    if (confirm('Delete this member?')) {
      await window.fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
      getMembers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button 
          onClick={exportToExcel}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
        >
          Export to Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <h2 className="text-xl font-bold mb-6">Post New Announcement</h2>
          {message && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}
          <form onSubmit={handleCreateAnnouncement} className="space-y-4 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Title</label>
              <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Content</label>
              <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} required rows={4} className="w-full px-4 py-3 rounded-xl bg-black/5 border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all">
              Post Announcement
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6">Member Management</h2>
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black/5 text-xs font-bold uppercase tracking-widest text-black/40">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-black/30">{m.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-black/5 px-2 py-1 rounded">Batch {m.batch}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={m.role}
                        onChange={(e) => updateRole(m.id, e.target.value)}
                        className="text-xs font-bold uppercase bg-black/5 px-2 py-1 rounded border-none focus:ring-0"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- App Component ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard/members" element={<ProtectedRoute><MembersDirectory /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
