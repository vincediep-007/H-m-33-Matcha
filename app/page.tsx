'use client'

import React from 'react';
import Link from "next/link";
import { QRCodeSVG } from 'qrcode.react';

export default function Home() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-sans">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[url('/pattern.png')] md:bg-repeat animate-pulse-slow"></div>

        <div className="z-10 text-center max-w-2xl">
          <div className="mb-6 inline-block p-4 rounded-full bg-matcha-100 animate-bounce-slow">
            <span className="text-4xl">🍵</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black font-serif text-matcha-900 mb-6 tracking-tighter">
            Hẻm 33
          </h1>
          <p className="text-xl md:text-2xl text-earth-600 mb-10 font-light leading-relaxed">
            Artisanal Matcha & Cacao <br /> Crafted with layers of flavor.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link href="/menu">
              <button className="bg-matcha-800 text-cream-50 px-10 py-5 rounded-full text-xl font-bold hover:bg-matcha-700 hover:scale-105 transition shadow-xl border-4 border-cream-100">
                View Menu
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      {mounted && (
        <div className="bg-white p-12 border-t border-matcha-100">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="text-center md:text-right max-w-sm">
              <h3 className="text-2xl font-bold text-matcha-900 mb-2">Scan to Order</h3>
              <p className="text-earth-500">Skip the line! Scan this code with your phone to browse our full menu and order instantly from your table.</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-matcha-200 group hover:scale-105 transition duration-500">
              <QRCodeSVG
                value="https://hem33matcha-iiwcg75gi-vinhs-projects-74415e66.vercel.app/menu"

                size={200}
                fgColor="#1C4532" // Matcha 900
                level="H"
                includeMargin={true}
              />
              <div className="text-center text-xs font-bold text-matcha-500 mt-2 uppercase tracking-widest">Hẻm 33 Menu</div>
              <div className="text-center text-[10px] text-gray-400 mt-1">Scan to open on phone</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-matcha-900 text-matcha-200 p-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Hẻm 33. All rights reserved.</p>
      </footer>
    </div>
  );
}