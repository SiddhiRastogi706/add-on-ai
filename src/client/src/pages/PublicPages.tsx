import React, { useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Star,
  CheckCircle2,
  Users,
  Award,
  Zap,
  Briefcase,
  HelpCircle,
  FileText,
  CreditCard,
  Headphones,
  Navigation,
  Menu,
  X
} from 'lucide-react';

export type PublicPageSlug =
  | 'features'
  | 'how-it-works'
  | 'services'
  | 'reviews'
  | 'about'
  | 'careers'
  | 'contact';

interface PublicPagesProps {
  slug: PublicPageSlug;
  onNavigate: (path: string) => void;
  onBookTruck?: () => void;
  onLogin?: () => void;
}

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  badge: string;
  heading: string;
  subheading: string;
}

const PAGE_METAS: Record<PublicPageSlug, PageMeta> = {
  features: {
    title: 'Features & Fleet Solutions - Truck Mitra Freight Network',
    description: 'Explore Truck Mitra platform features: automated load matching, digital FASTag payments, electronic Proof of Delivery (e-PoD), and live GPS fleet tracking.',
    canonical: 'https://truckmitra.in/p/features',
    badge: 'Enterprise Platform Capabilities',
    heading: 'Next-Gen Freight Features Engineered for Indian Logistics',
    subheading: 'From live IoT GPS tracking to instant automated freight settlements, discover why 50,000+ truckers and shippers run on Truck Mitra.'
  },
  'how-it-works': {
    title: 'How It Works - Simple 3-Step Truck Booking with Truck Mitra',
    description: 'Learn how Truck Mitra simplifies freight logistics. Post loads, get instant competitive bids from verified fleet owners, and track cargo from dispatch to delivery.',
    canonical: 'https://truckmitra.in/p/how-it-works',
    badge: 'Seamless Logistics Workflow',
    heading: 'How Truck Mitra Works in 3 Simple Steps',
    subheading: 'Book commercial trucks across India in minutes with transparent pricing, zero broker margins, and end-to-end digital tracking.'
  },
  services: {
    title: 'Transport Services - FTL, PTL & Commercial Freight | Truck Mitra',
    description: 'Discover Truck Mitra commercial freight services: Full Truckload (FTL), Part Truckload (PTL), container transport, express cargo, and cold-chain logistics.',
    canonical: 'https://truckmitra.in/p/services',
    badge: 'Comprehensive Freight Solutions',
    heading: 'Commercial Road Freight & Transport Services',
    subheading: 'Whether you need a 32ft multi-axle trailer for inter-state FTL or express container logistics, we provide verified trucks on demand.'
  },
  reviews: {
    title: 'Customer Reviews & Success Stories - Truck Mitra Logistics',
    description: 'Read real reviews from 10,000+ shippers and fleet owners who rely on Truck Mitra for fast truck dispatch, reliable drivers, and guaranteed zero-hidden-fee pricing.',
    canonical: 'https://truckmitra.in/p/reviews',
    badge: 'Verified Customer Testimonials',
    heading: 'Trusted by 10,000+ Shippers & Transporters',
    subheading: 'Hear directly from manufacturers, fleet owners, and supply chain leaders who eliminated delays and cut freight costs by up to 18%.'
  },
  about: {
    title: 'About Truck Mitra - India\'s Premier Digital Freight Marketplace',
    description: 'Truck Mitra is revolutionizing Indian commercial logistics by empowering transporters, drivers, and manufacturers with transparent pricing and digital tools.',
    canonical: 'https://truckmitra.in/p/about',
    badge: 'Our Mission & Vision',
    heading: 'Building India\'s Most Trusted Trucking Network',
    subheading: 'We connect shippers with verified truck owners nationwide, creating a reliable, transparent, and technology-driven transport ecosystem.'
  },
  careers: {
    title: 'Careers at Truck Mitra - Join the Logistics Revolution',
    description: 'Build the future of Indian freight transport with Truck Mitra. Explore open career opportunities in engineering, operations, product design, and freight sales.',
    canonical: 'https://truckmitra.in/p/careers',
    badge: 'Join Our Team',
    heading: 'Transform Logistics at Scale with Truck Mitra',
    subheading: 'Work on mission-critical technology powering India\'s $200B+ freight supply chain alongside high-energy builders and industry pioneers.'
  },
  contact: {
    title: 'Contact Truck Mitra - 24/7 Transport & Customer Support',
    description: 'Get in touch with Truck Mitra support team. Call +91-80767-45291 or email support@truckmitra.in for instant truck booking assistance and enterprise transport queries.',
    canonical: 'https://truckmitra.in/p/contact',
    badge: '24/7 Dedicated Support',
    heading: 'We Are Here to Assist Your Freight 24 Hours a Day',
    subheading: 'Have a load inquiry, enterprise contract question, or driver assistance request? Our transport specialists are available round the clock.'
  }
};

export const PublicPages: React.FC<PublicPagesProps> = ({
  slug,
  onNavigate,
  onBookTruck,
  onLogin
}) => {
  const meta = PAGE_METAS[slug] || PAGE_METAS.features;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Dynamically update document title and canonical tag
  useEffect(() => {
    document.title = meta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', meta.canonical);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, meta]);

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-950 tracking-tight block">
                TRUCK MITRA
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                Digital Freight Network
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => onNavigate('/p/features')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'features' ? 'text-blue-600 font-bold' : ''}`}
            >
              Features
            </button>
            <button
              onClick={() => onNavigate('/p/how-it-works')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'how-it-works' ? 'text-blue-600 font-bold' : ''}`}
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('/p/services')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'services' ? 'text-blue-600 font-bold' : ''}`}
            >
              Services
            </button>
            <button
              onClick={() => onNavigate('/p/reviews')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'reviews' ? 'text-blue-600 font-bold' : ''}`}
            >
              Reviews
            </button>
            <button
              onClick={() => onNavigate('/p/about')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'about' ? 'text-blue-600 font-bold' : ''}`}
            >
              About
            </button>
            <button
              onClick={() => onNavigate('/p/careers')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'careers' ? 'text-blue-600 font-bold' : ''}`}
            >
              Careers
            </button>
            <button
              onClick={() => onNavigate('/p/contact')}
              className={`hover:text-blue-600 transition-colors cursor-pointer ${slug === 'contact' ? 'text-blue-600 font-bold' : ''}`}
            >
              Contact
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="tel:+918076745291"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>+91-80767-45291</span>
            </a>
            {onLogin && (
              <button
                onClick={onLogin}
                className="hidden sm:inline-block text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              onClick={onBookTruck || onLogin}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Book Truck Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-blue-600" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-5 py-4 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/features'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'features' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              Features
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/how-it-works'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'how-it-works' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              How It Works
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/services'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'services' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              Services
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/reviews'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'reviews' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              Reviews
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/about'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'about' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              About
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/careers'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'careers' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              Careers
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/p/contact'); }}
              className={`block w-full text-left py-2 text-sm font-semibold ${slug === 'contact' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
            >
              Contact
            </button>
            {onLogin && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogin(); }}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-slate-100/70 border-b border-slate-200 text-xs py-2.5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 text-slate-500">
            <button onClick={() => onNavigate('/')} className="hover:text-blue-600">Home</button>
            <span>/</span>
            <span className="font-semibold text-slate-800 capitalize">{slug.replace('-', ' ')}</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-[#F8FAFC] border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>{meta.badge}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              {meta.heading}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {meta.subheading}
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onBookTruck || onLogin}
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
              >
                <span>Get Instant Freight Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="tel:+918076745291"
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-xs flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call Dispatch: +91-80767-45291</span>
              </a>
            </div>
          </div>
        </section>

        {/* Specific View Contents */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          {slug === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-blue-600" />,
                  title: 'Instant Automated Load Matching',
                  desc: 'AI-driven engine pairs your cargo with the nearest verified empty truck within 90 seconds, saving empty miles and fuel.'
                },
                {
                  icon: <Navigation className="w-6 h-6 text-emerald-600" />,
                  title: 'Live 24/7 IoT GPS Tracking',
                  desc: 'Track truck speed, location, and toll checkpoints with real-time transit ETA shared directly via WhatsApp alerts.'
                },
                {
                  icon: <CreditCard className="w-6 h-6 text-indigo-600" />,
                  title: 'Digital FASTag & Transparent Billing',
                  desc: 'Zero hidden driver halts or unofficial broker commissions. Every toll, diesel surcharge, and detention fee is audited.'
                },
                {
                  icon: <FileText className="w-6 h-6 text-purple-600" />,
                  title: 'Electronic Proof of Delivery (e-PoD)',
                  desc: 'Instant digital signature and photo PoD upload upon unloading. Invoice settlements processed without paper courier delay.'
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
                  title: 'Transit Insurance & Verified Drivers',
                  desc: 'Every driver undergoes 4-point KYC (Aadhaar, DL, Police verification, RC). Goods covered with optional comprehensive marine transit insurance.'
                },
                {
                  icon: <Headphones className="w-6 h-6 text-amber-600" />,
                  title: 'Dedicated Transport Manager',
                  desc: 'Each enterprise shipper is assigned a personal freight manager to coordinate loading, unloading, and interstate permits.'
                }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          )}

          {slug === 'how-it-works' && (
            <div className="max-w-3xl mx-auto space-y-8">
              {[
                {
                  step: '01',
                  title: 'Post Your Load & Route Details',
                  desc: 'Enter origin city, destination, cargo type (e.g. steel, FMCG, electronics, agro), weight in tonnes, and required truck body type (open, container, trailer).'
                },
                {
                  step: '02',
                  title: 'Receive Instant Bids & Driver Assignment',
                  desc: 'Within minutes, receive competitive freight quotes directly from verified fleet owners. Review truck rating, vehicle RC, driver credentials, and confirm the best bid.'
                },
                {
                  step: '03',
                  title: 'Live Tracking & Digital Delivery Sign-Off',
                  desc: 'Watch your truck move in real time on the Truck Mitra GPS map. Upon safe arrival at the receiver warehouse, approve digital e-PoD for automated settlement.'
                }
              ].map((s, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-blue-600 font-mono shrink-0">{s.step}</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slug === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Full Truckload (FTL) Transport',
                  desc: 'Dedicated commercial trucks (14ft, 17ft, 19ft, 22ft, 32ft MXL & trailers) for bulk factory and warehouse dispatch across all major interstate corridors in India.',
                  bullets: ['Direct door-to-door transit', 'Guaranteed placement within 2 hours', 'Payloads from 3.5 tonnes to 40+ tonnes']
                },
                {
                  title: 'Part Truckload (PTL) / LTL Consolidation',
                  desc: 'Cost-effective logistics for shipments smaller than a full container. Shared payload space with scheduled weekly line-haul dispatch across Tier 1 & 2 cities.',
                  bullets: ['Pay only for space occupied', 'Hub-and-spoke tracking', 'Protective palletized handling']
                },
                {
                  title: 'Daily Freight Rate Index & Calculator',
                  desc: 'Live market-tested spot freight rates based on diesel price shifts, return-trip availability, and mandi harvest seasonality.',
                  bullets: ['Transparent cost breakdown', 'Real-time lane price forecasts', 'Free for all verified shippers']
                },
                {
                  title: 'Reefer & Cold-Chain Express',
                  desc: 'Temperature-monitored refrigerated trucks for pharmaceuticals, dairy, fruits, vegetables, and frozen food logistics.',
                  bullets: ['Continuous IoT temperature logging', '-20°C to +15°C multi-temp chambers', 'Priority green-corridor transit']
                }
              ].map((s, i) => (
                <div key={i} className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {s.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {slug === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  author: 'Rajesh Sharma',
                  role: 'Supply Chain VP, North India Ceramics',
                  rating: 5,
                  comment: 'We dispatch 40+ trucks weekly from Morbi to Delhi NCR. Truck Mitra reduced our turnaround time from 4 days to under 36 hours. Best verified driver network in India.'
                },
                {
                  author: 'Vikramjit Singh',
                  role: 'Fleet Owner (28 Trucks), Punjab-Maharashtra Freight',
                  rating: 5,
                  comment: 'Earlier our trucks waited 3 days in Mumbai for return loads. With Truck Mitra app, we get return loads assigned before our truck even unloads. Zero idle days!'
                },
                {
                  author: 'Priya Iyer',
                  role: 'Logistics Head, Agro Food Export Ltd',
                  rating: 5,
                  comment: 'The live GPS tracking and instant digital e-PoD saves our accounting team hundreds of hours each month. 100% transparent freight billing with no surprises.'
                }
              ].map((r, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(r.rating)].map((_, si) => (
                        <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">"{r.comment}"</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <div className="font-bold text-xs text-slate-900">{r.author}</div>
                    <div className="text-[11px] text-slate-500">{r.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slug === 'about' && (
            <div className="max-w-3xl mx-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                Founded to solve India's most fragmented and unorganized supply chain challenges, <strong>Truck Mitra</strong> is a technology-first commercial transport marketplace. We bridge the critical gap between shippers needing fast, dependable freight movement and truck owners seeking fair, timely compensation.
              </p>
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-200 text-center">
                <div>
                  <div className="text-2xl sm:text-4xl font-black text-blue-600">50,000+</div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase mt-1">Verified Trucks</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-4xl font-black text-emerald-600">500+</div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase mt-1">Cities Covered</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-4xl font-black text-slate-900">99.4%</div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase mt-1">On-Time Dispatch</div>
                </div>
              </div>
              <p>
                Our proprietary freight routing algorithms match available truck capacity with real-time shipper demands across Delhi NCR, Mumbai, Bengaluru, Ahmedabad, Kolkata, Chennai, and tier-2 manufacturing hubs. By removing middlemen, auditing all transit tolls, and delivering 24/7 telematics, Truck Mitra is making Indian transport safer, faster, and more profitable.
              </p>
            </div>
          )}

          {slug === 'careers' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                🚀 We are hiring engineers, logistics operations managers, and business development executives to expand our freight marketplace. Send your CV to <strong>careers@truckmitra.in</strong>.
              </div>
              {[
                { title: 'Full Stack Software Engineer (Node / React / TS)', loc: 'Delhi NCR (Hybrid)', type: 'Full-time' },
                { title: 'Fleet Operations Lead - Interstate Logistics', loc: 'Delhi / Mumbai (Onsite)', type: 'Full-time' },
                { title: 'Enterprise Enterprise Sales Manager - Freight', loc: 'Bengaluru / Pune (Hybrid)', type: 'Full-time' }
              ].map((j, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{j.title}</h3>
                    <div className="text-xs text-slate-500 mt-1">{j.loc} &bull; {j.type}</div>
                  </div>
                  <a
                    href="mailto:careers@truckmitra.in"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Apply Now
                  </a>
                </div>
              ))}
            </div>
          )}

          {slug === 'contact' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Get in Touch with Truck Mitra</h3>
                  <p className="text-xs text-slate-600">
                    Reach our customer support, dispatch coordinators, and enterprise partnerships team directly.
                  </p>
                </div>
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Head Office:</strong>
                      <p>Truck Mitra Transport Hub, Outer Ring Road, Transport Nagar, Delhi NCR, 110042, India</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Direct Phone:</strong>
                      <p><a href="tel:+918076745291" className="hover:underline text-blue-600 font-bold">+91-80767-45291</a></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Support Email:</strong>
                      <p><a href="mailto:support@truckmitra.in" className="hover:underline text-blue-600 font-bold">support@truckmitra.in</a></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Operating Hours:</strong>
                      <p>Open 24 Hours / 7 Days a Week (Dispatch active 24/7)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Inquiry Form */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Send an Instant Message</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Freight Route / Load Details</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Need 32ft truck from Delhi to Ahmedabad for 15 tonne industrial load..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Thank you! Your dispatch inquiry has been submitted. A Truck Mitra coordinator will call you in 5 minutes.')}
                    className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                  >
                    Submit Freight Inquiry
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* REQUIREMENT 5: CRAWLABLE FOOTER NAP (Name, Address, Phone, Hours)        */}
      {/* ========================================================================= */}
      <footer className="pt-16 pb-12 border-t border-slate-200 bg-white text-slate-600 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-900 text-base">Truck Mitra</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                India's #1 digital freight booking network connecting verified shippers with 50,000+ commercial truck owners nationwide.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <div className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Solutions</div>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('/p/features')} className="hover:text-blue-600">Platform Features</button></li>
                <li><button onClick={() => onNavigate('/p/services')} className="hover:text-blue-600">FTL &amp; PTL Services</button></li>
                <li><button onClick={() => onNavigate('/p/how-it-works')} className="hover:text-blue-600">How It Works</button></li>
                <li><button onClick={() => onNavigate('/p/reviews')} className="hover:text-blue-600">Customer Reviews</button></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div>
              <div className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Company</div>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('/p/about')} className="hover:text-blue-600">About Truck Mitra</button></li>
                <li><button onClick={() => onNavigate('/p/careers')} className="hover:text-blue-600">Careers</button></li>
                <li><button onClick={() => onNavigate('/p/contact')} className="hover:text-blue-600">Contact Support</button></li>
                <li><a href="https://truckmitra.in/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">XML Sitemap</a></li>
              </ul>
            </div>

            {/* Col 4: Official Verification & Social */}
            <div>
              <div className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Follow Truck Mitra</div>
              <ul className="space-y-2">
                <li><a href="https://www.linkedin.com/company/truckmitra" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">LinkedIn: /company/truckmitra</a></li>
                <li><a href="https://www.facebook.com/truckmitra" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Facebook: /truckmitra</a></li>
                <li><a href="https://www.instagram.com/truckmitra" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">Instagram: @truckmitra</a></li>
                <li><a href="https://www.youtube.com/@truckmitra" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">YouTube: @truckmitra</a></li>
              </ul>
            </div>
          </div>

          {/* Crawlable Semantic HTML NAP Block */}
          <div className="border-t border-slate-200 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Truck Mitra Headquarters (NAP)</h4>
              <address className="not-italic leading-relaxed text-slate-600">
                Truck Mitra Transport Hub, Outer Ring Road, Transport Nagar, Delhi NCR, 110042, India
              </address>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Customer Support &amp; Dispatch</h4>
              <p>
                Phone: <a href="tel:+918076745291" className="font-bold text-blue-600 hover:underline">+91-80767-45291</a>
              </p>
              <p>
                Email: <a href="mailto:support@truckmitra.in" className="font-bold text-blue-600 hover:underline">support@truckmitra.in</a>
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Operating Business Hours</h4>
              <p className="leading-relaxed">
                Monday &ndash; Sunday: <span className="font-bold text-emerald-600">Open 24 Hours (24/7 Dispatch &amp; Support)</span>
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>&copy; 2026 Truck Mitra Logistics Network. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Transport</span>
              <span>Carrier Code of Conduct</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
