// src/pages/Home.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Carousel from '@/components/ui/Carousel';
import CircularGallery from '@/components/ui/CircularGallery';
import VideoGallery from '@/components/ui/VideoGallery';
import ModalPdfViewer from '@/components/ModalPdfViewer';

// Hero images
import cImage1 from '../assets/images/homepage/hero/img1.jpeg';
import cImage2 from '../assets/images/homepage/hero/img2.jpeg';
import cImage3 from '../assets/images/homepage/hero/img3.jpeg';
import cImage4 from '../assets/images/homepage/hero/img4.jpeg';
import cImage5 from '../assets/images/homepage/hero/img5.jpeg';
import cImage6 from '../assets/images/homepage/hero/img6.jpeg';

// Training Images
import tImage1 from '../assets/images/homepage/training/timg1.png';
import tImage2 from '../assets/images/homepage/training/timg2.jpg';
import tImage3 from '../assets/images/homepage/training/timg3.jpg';
import tImage4 from '../assets/images/homepage/training/timg4.jpg';
import tImage5 from '../assets/images/homepage/training/timg5.jpg';
import tImage6 from '../assets/images/homepage/training/timg6.jpg';
import tImage7 from '../assets/images/homepage/training/timg7.jpg';
import tImage10 from '../assets/images/homepage/training/timg10.jpg';
import tImage11 from '../assets/images/homepage/training/timg11.jpg';
import tImage12 from '../assets/images/homepage/training/timg12.jpg';
import tImage13 from '../assets/images/homepage/training/timg13.jpg';

// Operational Images
import oImage1 from '../assets/images/homepage/operational/oimg1.jpg';
import oImage2 from '../assets/images/homepage/operational/oimg2.jpg';
import oImage3 from '../assets/images/homepage/operational/oimg3.jpg';
import oImage4 from '../assets/images/homepage/operational/oimg4.jpg';
import oImage5 from '../assets/images/homepage/operational/oimg5.jpg';
import oImage6 from '../assets/images/homepage/operational/oimg6.jpg';
import oImage7 from '../assets/images/homepage/operational/oimg7.jpg';
import oImage8 from '../assets/images/homepage/operational/oimg8.jpg';

// Video Gallery
import vid1 from '@/assets/images/homepage/operational/oimg8.jpg';
import vid2 from '@/assets/images/homepage/operational/oimg8.jpg';
import vid3 from '@/assets/images/homepage/operational/oimg8.jpg';
// import vid1 from '@/assets/videos/vid1.mp4';
// import vid2 from '@/assets/videos/vid2.mp4';
// import vid3 from '@/assets/videos/vid3.mp4';

import bgImage2 from '../assets/dbg2.png';
import icgEmblem from '../assets/icg.png';
import icgFlag from '../assets/indiaflag2.png';
import IG_BHISHAM from '../assets/images/homepage/IG_BHISHAM.jpg';
import RCW from '../assets/images/homepage/Regionalcommander-west.png';
import WhatsNewTicker from '@/components/home/WhatsNewTicker';

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// --- Mock media (replace with real assets later as needed) ---
const slides = [
  { id: 1, image: cImage1 },
  { id: 2, image: cImage2 },
  { id: 3, image: cImage3 },
  { id: 4, image: cImage4 },
  { id: 5, image: cImage5 },
  { id: 6, image: cImage6 },
];

const trainingImgs = [
  tImage1, tImage2, tImage3, tImage4, tImage5, tImage6, tImage7, tImage10, tImage11, tImage12, tImage13
];
const operationalImgs = [
  oImage1, oImage2, oImage3, oImage4, oImage5, oImage6, oImage7, oImage8
];

const IgBhishamSharmaParagraphs = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/80 text-gray-800 border-l-4 border-(--orange500) dark:border-(--orange500)">
      <h1 className="text-2xl font-bold text-(--orange500) dark:text-(--orange500) mb-4 border-b pb-2">
        Inspector General Bhisham Sharma, PTM, TM: Commander, Coast Guard Region (West)
      </h1>

      <section className="space-y-3 text-blue-950 dark:text-blue-100">
        <p className="text-[15px] text-justify leading-relaxed break-words">
          Inspector General Bhisham Sharma, PTM, TM, assumed charge as the <b>Commander, Coast Guard Region (West)</b> at Mumbai on November 23, 2023. The Flag Officer joined the Indian Coast Guard in January 1990 and is an alumnus of the Indian Naval Academy, where he was honored as the Best Trainee Assistant Commandant. An accomplished aviator, he earned his coveted flying wings at the Indian Naval Helicopter Training School (HTS) in 1995. He has since served in all frontline helicopter squadrons on both the Western and Eastern Seaboards, successfully undertaking numerous operations, including the critical Search and Rescue (SAR) of six personnel adrift in the Andaman Sea in February 2001.
        </p>
        <p className="text-[15px] text-justify leading-relaxed break-words">
          The Flag Officer possesses exceptionally rich operational experience and holds a unique record: he is the **only CG Aviator** to have commanded all four classes of ships in the Coast Guard. These include the Inshore Patrol Vessel (IPV) ICGS Chandbibi, the Extra Fast Patrol Vessel (XFPV) ICGS Kasturba Gandhi (as its commissioning CO), the new generation Offshore Patrol Vessel (OPV) ICGS Vijit, and the Advanced Offshore Patrol Vessel (AOPV) ICGS Sagar. Prior to his elevation to Flag Rank, he was commanding the Coast Guard Air Station at Chennai.
        </p>
        <p className="text-[15px] text-justify leading-relaxed break-words">
          IG Sharma has held several pivotal staff and ashore appointments across the service. His notable roles include Chief Staff Officer (P&A) at Regional Headquarters (West) Mumbai, Chief Staff Officer (Operations) at Regional Headquarters (East) Chennai, and **District Commander, Coast Guard District Maharashtra**. At the Coast Guard Headquarters in New Delhi, he has served as the **Coast Guard Advisor (CGA)** to the Director General, Director (Infra & Works), Principal Director (Air Staff), and Deputy Director General (Aviation). Immediately prior to assuming command of the Western Region, he held the strategic appointment of **Commander, Coast Guard Region (A&N)**, where he spearheaded infrastructure growth and operational integration within the overall mandate of the Andaman & Nicobar Command (ANC).
        </p>
        <p className="text-[15px] text-justify leading-relaxed break-words">
          The Flag Officer is a graduate of the prestigious **Defence Services Staff College (DSSC), Wellington**. He is a recipient of the **Tatrakshak Medal (Meritorious Service)** and has also been commended by the Director General, Indian Coast Guard on two separate occasions. Outside of his service, he is an avid cyclist and actively promotes cycling among the Coast Guard fraternity. He is married to Mrs. Anju Sharma (Home Maker) and the couple has two sons, Sankalp and Sukkrit.
        </p>
      </section>
    </div>
  );
};

const documentItems = [
  { title: "NOSDCP Circular 05/2025", path: "/docs/NOSDCP_Circular_05_  .pdf" },
  { title: "10th National Level Pollution Response Exercise (NATPOLREX-X)", path: "/docs/Notice_NATPOLREX_X.pdf" },
  { title: "Chairperson NOS DCP Circular No: 04/2025", path: "/docs/NOSDCP_Circular_04_2025.pdf" },
  { title: "CNA NOSDCP 07-2025", path: "/docs/CNA_NOSDCP_07_2025.pdf" },
  { title: "NOSDCP Circular 01/2025", path: "/docs/NOSDCP_Circular_01_2025.pdf" },
  { title: "CNA Circular 02", path: "/docs/CNA_Circular_02_25.pdf" },
  { title: "CNA Circular 03", path: "/docs/CNA_Circular_03_25.pdf" },
];

export default function Home() {
  const [openPdf, setOpenPdf] = useState(null);

// Robust click handler — resolves path from item.path, item.href or by matching title in documentItems
const handleDocClick = (item, e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  try {
    console.log('Opening document:', item.title, item.path ?? item.href);

    // Try to get the raw path from the item first
    let raw = item.path ?? item.href ?? "";

    // If raw missing, try to find a match in documentItems by title
    if (!raw) {
      const matched = documentItems.find(d => String(d.title).trim() === String(item.title).trim());
      if (matched && (matched.path || matched.href)) {
        raw = matched.path ?? matched.href;
        console.log('handleDocClick: found match in documentItems ->', raw);
      }
    }

    if (!raw) {
      // nothing we can do
      console.error('handleDocClick: no path/href found for', item);
      // Optionally show a user-friendly message
      // alert('Document path not found for: ' + item.title);
      return;
    }

    // Normalize into a usable URL for browser / Tauri
    let normalized = String(raw).trim();

    const hasScheme = /^(https?:\/\/|asset:\/\/|blob:|data:|file:\/\/)/i.test(normalized);
    if (!hasScheme) {
      if (!normalized.startsWith('/')) normalized = `/${normalized}`;
      if (typeof window !== 'undefined' && window.location && String(window.location.origin).startsWith('http')) {
        normalized = `${window.location.origin}${normalized}`; // e.g. http://localhost:5173/docs/file.pdf
      } else {
        normalized = `asset://${normalized.replace(/^\/+/, '')}`;
      }
    }

    console.log('handleDocClick -> resolved:', normalized);
    setOpenPdf({ path: normalized, title: item.title ?? 'Document' });
  } catch (err) {
    console.error('handleDocClick error', err);
  }
};


  // Close PDF modal
  const closePdfModal = () => {
    setOpenPdf(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Shared background like Dashboard */}
      <img
        src={bgImage2}
        alt="PRABAL background"
        className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150"
      />
      <div
        className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
        style={{
          background:
            'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
        }}
      />
      {/* Dark overlay only in dark mode */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.8),_transparent_70%)] dark:block" />

      {/* Page content */}
      <div className="relative z-10 px-4 text-slate-900 md:px-10 dark:text-[var(--soft-white,_#e5e7eb)]">
        {/* Top nav / brand – Coast Guard tri-logo strip (full-width) */}
        <header
          className="mb-8 -mx-4 md:-mx-10 border-b border-slate-200 bg-white/95 shadow-md shadow-slate-300/40 overflow-hidden dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/40"
        >
          <div className="grid h-24 grid-cols-3 divide-x divide-slate-100 md:h-32 dark:divide-slate-800">
            {/* Left: Coast Guard emblem */}
            <div className="flex items-center justify-left bg-white/90 dark:bg-slate-950/95">
              <img
                src={icgEmblem}
                alt="Indian Coast Guard Emblem"
                className="h-16 w-auto md:h-20 lg:h-30 object-contain"
              />
            </div>

            {/* Center: Coast Guard flag / banner */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-auto flex items-center"
            >
              <div className="rounded-md overflow-hidden bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] p-3 flex items-center gap-3">
                <div className="flex-1 text-4xl">
                  <div className="flex w-fit animate-marquee">
                    {/* 2a. Content Copy 1 */}
                    <div
                      className="whitespace-nowrap font-extrabold tracking-wide uppercase bg-gradient-to-r from-sky-700 via-blue-900 to-sky-700 dark:from-sky-300 dark:via-blue-200 dark:to-sky-300 text-transparent bg-clip-text drop-shadow-sm"
                    >
                      Ensuring Clean Seas and Coast &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>

                    {/* 2b. Content Copy 2 (The crucial duplicate!) */}
                    <div
                      className="whitespace-nowrap font-extrabold tracking-wide uppercase bg-gradient-to-r from-sky-700 via-blue-900 to-sky-700 dark:from-sky-300 dark:via-blue-200 dark:to-sky-300 text-transparent bg-clip-text drop-shadow-sm"
                    >
                      Ensuring Clean Seas and Coast &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                    {/* 2b. Content Copy 2 (The crucial duplicate!) */}
                    <div
                      className="whitespace-nowrap font-extrabold tracking-wide uppercase bg-gradient-to-r from-sky-700 via-blue-900 to-sky-700 dark:from-sky-300 dark:via-blue-200 dark:to-sky-300 text-transparent bg-clip-text drop-shadow-sm"
                    >
                      Ensuring Clean Seas and Coast
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Ministry of Defence emblem */}
            <div className="flex items-center justify-end bg-white/90 dark:bg-slate-950/95">
              <img
                src={icgFlag}
                alt="Indian Coast Guard Flag"
                className="h-14 w-auto md:h-18 lg:h-30 mr-10 object-contain"
              />
            </div>
          </div>
        </header>

        {/* HERO: Bento grid */}
        <section className="mb-10">
          <div className="mb-5 max-w-3xl space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl"
            >
              An overview for{' '}
              <span className="text-orange-500 dark:text-orange-500">
                Coast Guard Pollution Response Team (West)
              </span>{' '}
              on Training.
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="grid gap-4 md:grid-cols-3"
          >
            {/* Main hero card */}
            <div className="md:col-span-2 flex justify-between rounded-2xl relative overflow-hidden">
              <Carousel
                items={slides}
                autoplay={true}
                autoplayDelay={3500}
                pauseOnHover={true}
                loop={true}
                fullWidth={true}
                columnsVisible={1}
                imageHeight={400}
                showNav={true}
              />
            </div>

            {/* What's New card */}
            <div className="rounded-2xl flex flex-col border border-slate-200 bg-white/85 p-4 backdrop-blur-xl shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <div className="mb-10 flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-(--orange500) dark:text-(--orange500)">
                  What&apos;s New
                </p>
                <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Live updates · Auto scroll
                </span>
              </div>

              {/* This wrapper gives the ticker height that matches the card */}
              <div className="mt-1 flex-1 overflow-hidden">
                <WhatsNewTicker
                  items={documentItems}
                  autoScrollSpeed={25}
                  reverse={false}
                  onItemClick={handleDocClick}
                />
              </div>

            </div>
          </motion.div>
        </section>

        {/* ABOUT section */}
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                ABOUT
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* a. Leadership card */}
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              {/* Top section: 3-column grid */}
              <div className="grid grid-cols-3 items-center text-center gap-3">
                {/* Left logo / image holder */}
                <div className="relative mx-auto h-35 w-30 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700/90 dark:bg-slate-950/80">
                  {/* Logo / initials */}
                  <img src={RCW} alt="IG_BHISHAM" className="relative h-full w-full object-contain" />
                </div>

                {/* Center: label + title + subtext */}
                <div className="min-w-0">
                  <p className="truncate text-md font-semibold text-slate-900 dark:text-slate-100">
                    Inspector General Bhisham Sharma
                  </p>
                  <p className="mb-1 text-md font-semibold uppercase tracking-wide text-(--orange500) dark:text-(--orange500)">
                    PTM,TM
                  </p>
                  <p className="text-md text-slate-600 dark:text-slate-400">
                    Commander Coast Guard Region (West)
                  </p>
                </div>

                {/* Right image holder (e.g. unit badge / avatar) */}
                <div className="relative mx-auto h-35 w-30 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700/90 dark:bg-slate-950/80">
                  <img src={IG_BHISHAM} alt="IG_BHISHAM" className="relative h-full w-full object-contain" />
                </div>
              </div>
              {/* Bottom section: brief about info */}
              <div className="mt-3 border-t border-slate-200/70 pt-3 text-[0.75rem] text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
                <IgBhishamSharmaParagraphs />
              </div>
            </div>

            {/* b. About us */}
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 backdrop-blur-xl shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <p className="mb-2 text-2xl font-semibold text-(--orange500) dark:text-(--orange500)">
                About Us
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300 text-justify leading-relaxed break-words">
                The Coast Guard Pollution Response Team (W), Mumbai was initially established as Pollution Control Cell in the 80s at Naval Dockyard, Mumbai. However, the unit was activated on 15 Apr 1989 as Coast Guard Pollution Response Cell within the premises of Mumbai Port Authority for responding to marine oil spills on the West coast of India. Prior to accord of Govt. sanction, the appointment of Officers and dedicated Staff was commenced w.e.f. 06 Jun 94 and Government sanction for establishing Pollution Response Team (West) was accorded vide Ministry of Defence sanction letter CS/0116/CG/403/DO/D (N-II) dated 25 Mar 96. On 15 Apr 89, the Unit was shifted to MbPT Shed No. 3, New Ferry Wharf and again shifted to present Loco/ Boiler Shed, MbPT Workshop at Mazgaon on 09 Jul 2017.
              </p>
            </div>
          </div>
        </section>

        {/* IMAGE GALLERY with hover animation */}
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                IMAGE GALLERY
              </p>
            </div>
          </div>

          {/* Training */}
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-sky-800 dark:text-sky-100">
                Training
              </p>
            </div>
          </div>
          <CircularGallery images={trainingImgs} autoPlay autoPlayInterval={4000} />

          {/* Operational */}
          <div className="mb-4 mt-8 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-sky-800 dark:text-sky-100">
                Operational
              </p>
            </div>
          </div>
          <CircularGallery images={operationalImgs} autoPlay autoPlayInterval={4000} reverse />
        </section>

        {/* VIDEO GALLERY (cards, smaller height) */}
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                VIDEO GALLERY
              </p>
            </div>
            <p className="hidden text-[0.75rem] text-slate-500 md:block dark:text-slate-400">
              Click any card to open video in a secure modal.
            </p>
          </div>

          <VideoGallery
            videos={[
              { src: vid1, title: 'Indian Coast Guard Documentary-By Doordarshan Kendra,Ahmedabad', description: '' },
              { src: vid2, title: 'Indian Coast Guard Motivational Movie I', description: '' },
            ]}
            autoScrollSpeed={25}
            reverse={false}
          />
        </section>
      </div>

      {/* PDF Modal - Use the ModalPdfViewer component */}
      {openPdf && (
        <ModalPdfViewer
          src={openPdf.path}   // <-- ensure prop name 'src' is used
          title={openPdf.title}
          onClose={() => setOpenPdf(null)}
        />
      )}

    </div>
  );
}