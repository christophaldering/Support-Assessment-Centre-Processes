"use client";

export default function LandingHero() {
  return (
    <section className="w-full bg-[#FFFBF0]" data-testid="section-hero">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700]">
                ARAG SE
              </p>
              <h1
                className="text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] font-bold text-black"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                Executive Potential
                <br />
                Journey
              </h1>
            </div>
            <h2
              className="text-2xl md:text-3xl text-black/80 font-medium"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              Business Development Pitch
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
              Strategische Entscheidungssimulation mit strukturierter
              Potenzialbeobachtung.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-[2px] bg-[#FFD700]" />
              <span className="text-xs tracking-widest uppercase text-gray-400 font-medium">
                Board-Level Assessment
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] lg:aspect-[16/11]">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
              <svg
                className="w-full h-full opacity-20"
                viewBox="0 0 800 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="80" y="200" width="640" height="20" rx="4" fill="#FFD700" opacity="0.3" />
                <rect x="80" y="240" width="400" height="12" rx="3" fill="white" opacity="0.15" />
                <rect x="80" y="265" width="520" height="12" rx="3" fill="white" opacity="0.1" />
                <circle cx="200" cy="400" r="60" fill="#FFD700" opacity="0.08" />
                <circle cx="400" cy="380" r="80" fill="#FFD700" opacity="0.06" />
                <circle cx="600" cy="420" r="50" fill="#FFD700" opacity="0.1" />
                <rect x="150" y="350" width="2" height="120" fill="white" opacity="0.1" />
                <rect x="300" y="320" width="2" height="150" fill="white" opacity="0.08" />
                <rect x="450" y="340" width="2" height="130" fill="white" opacity="0.1" />
                <rect x="600" y="360" width="2" height="110" fill="white" opacity="0.08" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                <span className="text-sm tracking-wider uppercase font-medium">Strategic Board Session</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-[#FFD700]/[0.05]" />
          </div>
        </div>
      </div>
    </section>
  );
}
