import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Award,
  Users,
  PartyPopper,
  Zap,
  Check,
  ChevronRight,
  BrainCircuit,
  Search,
  Share2,
  Megaphone,
  BarChart3,
  Layers,
  Crown,
  Mail,
  Calendar,
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { SlotBookingModal } from './SlotBookingModal';

interface FounderLifetimeOfferSectionProps {
  onClaim?: () => void;
  onPayNow?: (planId: string) => void;
  onOpenBooking?: () => void;
}

export const FounderLifetimeOfferSection: React.FC<FounderLifetimeOfferSectionProps> = ({
  onClaim,
  onPayNow,
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [slotData, setSlotData] = useState({
    totalSlots: 100,
    claimedSlots: 88,
    remainingSlots: 12,
    isSoldOut: false,
    price: 499,
    originalPrice: 14999,
    discountPercent: 97,
    slotNumber: 1,
    currency: '₹',
    recentClaims: [
      { name: 'Kavita Sharma', city: 'Bengaluru', claimedAt: '3 mins ago' },
      { name: 'Rohan Mehra', city: 'Mumbai', claimedAt: '7 mins ago' },
      { name: 'Aditya Verma', city: 'Delhi NCR', claimedAt: '12 mins ago' },
      { name: 'Sneha Patel', city: 'Ahmedabad', claimedAt: '19 mins ago' },
      { name: 'Vikram Joshi', city: 'Pune', claimedAt: '24 mins ago' },
    ],
  });

  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  // Fetch real-time slot state from backend
  useEffect(() => {
    const fetchStatus = () => {
      ApiClient.getSlotStatus()
        .then((data) => {
          if (data) {
            setSlotData(data);
          }
        })
        .catch(() => {});
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Celebration Confetti Explosion
  const fireConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#537CF3', '#EC4899', '#F59E0B'] });
    fire(0.2, { spread: 60, colors: ['#10B981', '#6366F1', '#F43F5E'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleClaimClick = () => {
    fireConfetti();
    if (onOpenBooking) {
      onOpenBooking();
    } else {
      setIsBookingModalOpen(true);
    }
  };

  const tabs = [
    { id: 0, label: '⚡ Slot #1 Live Counter', icon: Flame },
    { id: 1, label: '💎 What You Get (Lifetime)', icon: Award },
    { id: 2, label: '🔒 3-Step Slot Reservation', icon: ShieldCheck },
    { id: 3, label: '🎉 Founder Celebration & Guarantee', icon: PartyPopper },
  ];

  const percentClaimed = Math.round((slotData.claimedSlots / slotData.totalSlots) * 100);

  return (
    <section id="founder-offer" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto relative">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-r from-emerald-200/20 via-amber-200/25 to-indigo-200/30 blur-3xl rounded-full pointer-events-none" />

      {/* Main Glass Container with Gradient Border */}
      <div className="relative z-10 rounded-4xl bg-gradient-to-b from-white/95 via-white/90 to-amber-50/40 backdrop-blur-2xl border-2 border-amber-300/70 shadow-2xl p-6 sm:p-12 overflow-hidden">
        {/* Top Floating Badge - Clickable to Book */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <button
            onClick={handleClaimClick}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 via-amber-500 to-indigo-600 hover:from-emerald-500 hover:to-indigo-700 text-white shadow-lg animate-pulse transition-transform hover:scale-105"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>🔥 BOOK YOUR VIP FOUNDER SLOT #1 • STRICTLY 100 SLOTS (CLICK TO BOOK)</span>
          </button>

          {/* Urgency Countdown */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-slate-300">Auto-Lock in:</span>
            <span className="text-amber-300">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Headline & Value Proposition */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <button
            onClick={handleClaimClick}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200 mb-3 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>VIP Slot Reservation: Free Booking • Instant Confirmation on Gmail</span>
          </button>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-3">
            Book Your Founder VIP Slot, <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">100% Free Reservation</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Slot 1 is strictly capped at <strong className="text-slate-900">100 users</strong> on a first-come, first-served basis. Reserve your VIP onboarding slot with your Name, Phone &amp; Gmail. We'll send your slot confirmation, calendar invite &amp; access credentials directly to your Gmail.
          </p>
        </div>

        {/* 4 Interactive Pages / Tabs Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 p-1.5 bg-slate-100/90 rounded-2xl max-w-3xl mx-auto mb-10 overflow-x-auto border border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 3) fireConfetti();
                }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-md border border-slate-200/80 scale-102'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Live Counter & Urgency Dashboard */}
        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div
              key="tab-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Progress & Ticker */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                      Live Slot 1 Allocation:
                    </span>
                    <span className="text-rose-600 font-mono text-sm">
                      {slotData.claimedSlots} / {slotData.totalSlots} Slots Booked
                    </span>
                  </div>

                  {/* Animated Progress Meter */}
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-600 transition-all duration-1000 relative"
                      style={{ width: `${percentClaimed}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Backend Slot Counter Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-black text-[11px]">
                      🔥 Only {slotData.remainingSlots} Slots Left!
                    </span>
                  </div>
                </div>

                {/* Live Recent Claims Stream */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Recent Founder Reservations (Live Stream):
                  </span>
                  <div className="space-y-1.5">
                    {slotData.recentClaims.map((claim, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-200/60 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-slate-800">{claim.name}</span>
                          <span className="text-[11px] text-slate-400">({claim.city})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{claim.claimedAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Action Box */}
              <div className="lg:col-span-5 p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl space-y-6 text-center border border-indigo-500/30 relative">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
                    Booking: 100% Free
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black uppercase tracking-wider">
                    Slot 1 • VIP Batch
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-slate-400 line-through text-xs">Standard Subscription: ₹14,999 / year</div>
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-1">
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">Free VIP Slot</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mt-2 space-y-0.5">
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Zero Advance Payment • Instant Confirmation on Gmail
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Reserve your slot with Name, Phone &amp; Gmail. 1-on-1 AI setup included.
                    </div>
                  </div>
                </div>

                {/* THE REPLACED ACTION BUTTON (Image 2) */}
                <button
                  onClick={handleClaimClick}
                  disabled={slotData.isSoldOut}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all transform hover:-translate-y-0.5 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    slotData.isSoldOut
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-emerald-500/25'
                  }`}
                >
                  {slotData.isSoldOut ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Slot 1 Sold Out (100/100 Reached)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white" />
                      <span>✨ Book Your Founder Slot (Instant Gmail Alert)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-4 pt-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Free Booking
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Activation
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Feature Suite Included */}
          {activeTab === 1 && (
            <motion.div
              key="tab-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Central Marketing Brain', desc: 'Continuous brand crawling, keyword mapping & strategic positioning 24/7.', icon: BrainCircuit, color: 'text-brand-600', bg: 'bg-brand-50' },
                  { title: 'Autonomous SEO Engine', desc: 'Keyword audits, schema generator, LLMs.txt & AEO generative search readiness.', icon: Search, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { title: 'Poster & Creative Studio', desc: 'One-prompt 8K photorealistic marketing posters in 1:1, 9:16 and 16:9 formats.', icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { title: 'Paid Ads Optimization', desc: 'ROAS balancer, ad copy generator & hard budget safeguards.', icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { title: 'Autonomous Social Planner', desc: 'Instagram, LinkedIn & Facebook multi-format queue with 1-click scheduling.', icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { title: 'All Future Lifetime Updates', desc: 'Never pay monthly subscription fees. Free access to new AI models and releases.', icon: Crown, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex items-start gap-3.5 text-left">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={handleClaimClick}
                  className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>✨ Book Your Free Founder Slot (Reserve All Modules)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab 3: 3-Step Slot Reservation Entry */}
          {activeTab === 2 && (
            <motion.div
              key="tab-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: '01', title: 'Fill Name, Phone & Gmail', desc: 'Enter your basic contact details in the reservation modal so we can personalize your AI marketing team.' },
                  { step: '02', title: 'Pick Date & Time Slot', desc: 'Choose a preferred onboarding slot for your 1-on-1 strategy demonstration and workspace walkthrough.' },
                  { step: '03', title: 'Instant Gmail Confirmation', desc: 'Receive instant calendar invite, Google Meet link & direct command center login credentials on your Gmail.' },
                ].map((s, idx) => (
                  <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft relative text-left">
                    <div className="text-3xl font-black text-amber-500/80 mb-3">{s.step}</div>
                    <h3 className="font-extrabold text-base text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Backend Auto-Lock Enforcement Note */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900">Backend Auto-Stop Guarantee: </strong>
                  The system actively enforces <code>max_slots = 100</code>. When user #100 registers, the API automatically triggers a hard shutdown on Batch 1.
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleClaimClick}
                  className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-black shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Free Slot Reservation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Founder Celebration & Guarantee */}
          {activeTab === 3 && (
            <motion.div
              key="tab-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6 max-w-2xl mx-auto py-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <PartyPopper className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Welcome to the Founding 100 Members Club!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Slot booking is 100% free for everyone! As part of Slot #1, you lock in lifetime founder status, priority AI inference bandwidth, direct roadmap influence, and zero monthly fees for life.
                </p>
              </div>

              {/* Celebrate Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={fireConfetti}
                  className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4 text-rose-500" />
                  <span>Click to Celebrate! 🎉</span>
                </button>
                <button
                  onClick={handleClaimClick}
                  className="px-8 py-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 shadow-soft transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>✨ Book Free Slot (Instant Gmail Alert)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Free Booking • Instant Confirmation on Gmail &amp; WhatsApp</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Internal Slot Booking Modal Fallback */}
      <SlotBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          if (onClaim) onClaim();
        }}
      />
    </section>
  );
};
export default FounderLifetimeOfferSection;
