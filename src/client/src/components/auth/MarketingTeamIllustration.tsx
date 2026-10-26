import React from 'react';

const skin = ['#f2c3a0', '#c98b64', '#8d5a3b'];

export const MarketingTeamIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    role="img"
    aria-label="A marketing team creating social media content and reviewing campaign growth"
    viewBox="0 0 440 250"
    className={className}
  >
    <defs>
      <linearGradient id="mti-desk" x1="0" x2="1">
        <stop offset="0" stopColor="#4c1d95" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="mti-screen" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#0f172a" />
        <stop offset="1" stopColor="#1e1b4b" />
      </linearGradient>
    </defs>

    <ellipse cx="220" cy="228" rx="205" ry="14" fill="#000" opacity=".25" />

    <rect x="130" y="14" width="180" height="104" rx="10" fill="url(#mti-screen)" stroke="#6366f1" strokeOpacity=".5" />
    <path d="M148 98 L178 78 L204 88 L236 58 L262 66 L292 36" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="292" cy="36" r="5" fill="#e879f9" />
    <rect x="148" y="28" width="46" height="6" rx="3" fill="#818cf8" opacity=".7" />
    <rect x="148" y="40" width="30" height="5" rx="2.5" fill="#818cf8" opacity=".4" />

    <g>
      <rect x="22" y="40" width="74" height="40" rx="12" fill="#fff" opacity=".95" />
      <path d="M34 78 L30 90 L46 80Z" fill="#fff" opacity=".95" />
      <path d="M44 66c-8-5-11-9-11-13a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 4-3 8-11 13z" fill="#f43f5e" />
      <rect x="62" y="52" width="26" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="62" y="62" width="18" height="5" rx="2.5" fill="#cbd5e1" />
    </g>
    <g>
      <rect x="344" y="52" width="74" height="40" rx="12" fill="#fff" opacity=".95" />
      <path d="M406 90 L412 102 L396 92Z" fill="#fff" opacity=".95" />
      <circle cx="364" cy="72" r="10" fill="#8b5cf6" />
      <path d="M360 72l7-4v8z" fill="#fff" />
      <rect x="380" y="64" width="28" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="380" y="74" width="18" height="5" rx="2.5" fill="#cbd5e1" />
    </g>

    <rect x="14" y="170" width="412" height="16" rx="8" fill="url(#mti-desk)" />
    <rect x="40" y="186" width="10" height="38" rx="3" fill="#312e81" />
    <rect x="390" y="186" width="10" height="38" rx="3" fill="#312e81" />

    <g>
      <path d="M62 170 C60 140 72 124 92 124 C112 124 124 140 122 170Z" fill="#6366f1" />
      <rect x="84" y="108" width="16" height="18" rx="6" fill={skin[0]} />
      <circle cx="92" cy="98" r="19" fill={skin[0]} />
      <path d="M73 96 C72 76 112 72 111 96 C106 86 82 84 73 96Z" fill="#1f2937" />
      <rect x="86" y="146" width="62" height="24" rx="4" fill="#cbd5e1" />
      <rect x="90" y="150" width="54" height="16" rx="2" fill="#38bdf8" opacity=".85" />
      <rect x="82" y="168" width="78" height="4" rx="2" fill="#94a3b8" />
    </g>

    <g>
      <path d="M186 170 C184 138 198 120 220 120 C242 120 256 138 254 170Z" fill="#ec4899" />
      <rect x="212" y="104" width="16" height="18" rx="6" fill={skin[1]} />
      <circle cx="220" cy="94" r="20" fill={skin[1]} />
      <path d="M200 92 C198 68 242 66 240 92 C236 80 208 78 200 92Z" fill="#111827" />
      <path d="M200 132 L172 108" stroke={skin[1]} strokeWidth="9" strokeLinecap="round" />
      <circle cx="171" cy="106" r="6" fill={skin[1]} />
    </g>

    <g>
      <path d="M316 170 C314 140 326 124 346 124 C366 124 378 140 376 170Z" fill="#10b981" />
      <rect x="338" y="108" width="16" height="18" rx="6" fill={skin[2]} />
      <circle cx="346" cy="98" r="19" fill={skin[2]} />
      <path d="M327 96 C324 72 370 70 365 96 C360 84 336 82 327 96Z" fill="#0b0f19" />
      <path d="M326 142 L304 120" stroke={skin[2]} strokeWidth="9" strokeLinecap="round" />
      <rect x="292" y="94" width="18" height="30" rx="4" fill="#0f172a" stroke="#e879f9" strokeWidth="2" />
      <circle cx="301" cy="108" r="5" fill="#e879f9" />
      <path d="M298 118h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>

    <g fill="#fde68a">
      <path d="M118 36l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      <path d="M326 134l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".8" />
    </g>
  </svg>
);
