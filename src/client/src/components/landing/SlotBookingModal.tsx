import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { ApiClient } from '../../services/api';

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bookingData: any) => void;
}

export const SlotBookingModal: React.FC<SlotBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [slotDate, setSlotDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slotTime, setSlotTime] = useState('02:00 PM - 03:00 PM IST');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const timeSlots = [
    '11:00 AM - 12:00 PM IST',
    '02:00 PM - 03:00 PM IST',
    '04:30 PM - 05:30 PM IST',
    '07:00 PM - 08:00 PM IST',
  ];

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899'],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid phone or WhatsApp number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Gmail / email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await ApiClient.bookSlot({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        slotDate,
        slotTime,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSuccessData(res);
        fireConfetti();
        if (onSuccess) {
          onSuccess(res);
        }
      } else {
        setError(res.message || 'Failed to book slot. Please try again.');
      }
    } catch (err: any) {
      console.error('Slot booking error:', err);
      setError(err.message || 'Failed to book slot. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-white via-white to-slate-50 rounded-4xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Top Decorative Header Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-600" />

          {/* Close Button */}
          <button
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {successData ? (
              /* Success View */
              <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-soft">
                  <ShieldCheck className="w-9 h-9" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Slot #{successData.slotNumber} Reserved
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                    Your Founder Slot is Confirmed!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    Aapka VIP Onboarding slot successfully confirm ho chuka hai.
                  </p>
                </div>

                {/* Email Sent Notification Box */}
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-left text-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>Confirmation Email Dispatched to Gmail:</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-100 font-mono text-[12px] text-indigo-950 font-bold break-all">
                    {successData.booking.email}
                  </div>
                  <p className="text-[11px] text-indigo-800/80">
                    Aapki Gmail par full calendar invitation, session agenda aur direct dashboard credentials send kar diye gaye hain. Please check your inbox / updates folder!
                  </p>
                </div>

                {/* Booking Summary Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left text-xs space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Reservation Details:
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Name:</span>
                      <strong className="text-slate-900">{successData.booking.name}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Phone / WhatsApp:</span>
                      <strong className="text-slate-900">{successData.booking.phone}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Scheduled Date:</span>
                      <strong className="text-emerald-700">{successData.booking.slotDate}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Time Slot:</span>
                      <strong className="text-emerald-700">{successData.booking.slotTime}</strong>
                    </div>
                  </div>
                </div>

                {/* Next Steps CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      handleResetAndClose();
                      window.location.href = '/login';
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to AI Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetAndClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form View */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-black uppercase tracking-wider mb-2">
                    <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Strictly 100 Slots Batch • 100% Free VIP Reservation</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    Book Your Founder VIP Slot
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Enter your name, WhatsApp number &amp; Gmail. Aapko turant Gmail par confirmation aur Google Meet session details receive ho jayengi.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Input Fields */}
                <div className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Phone & Gmail Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Phone / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Gmail */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Gmail / Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rajesh@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company / Brand Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Company / Brand Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Truck Mitra Logistics"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Date & Time Slot Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Preferred Date
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={slotDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setSlotDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Time Slot */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Time Slot
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          value={slotTime}
                          onChange={(e) => setSlotTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs appearance-none"
                        >
                          {timeSlots.map((ts) => (
                            <option key={ts} value={ts}>
                              {ts}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Growth Goal Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Primary Growth Goal / Requirement <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Generate high-volume freight booking leads &amp; SEO route rankings"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Reserving Slot &amp; Dispatched to Gmail...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>Confirm &amp; Reserve VIP Slot (Instant Gmail Alert)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2.5">
                    🔒 Zero Payment Required • Instant Confirmation on Gmail &amp; WhatsApp
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
