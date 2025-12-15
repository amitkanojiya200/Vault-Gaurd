// src/components/Footer.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRoute, ROUTES } from "../router/Router";

import icgLogo from '../assets/icg-logo.png';
/**
 * Footer with real app routing (Tauri-friendly)
 * - Uses useRoute().navigate(...) instead of href="#"
 * - Theme friendly, same layout as before
 */

const LINK_SECTIONS = [
  {
    title: "Navigation",
    links: [
      { label: "Home", routeKey: ROUTES.HOME },
      { label: "Dashboard", routeKey: ROUTES.DASHBOARD },
      { label: "Search", routeKey: ROUTES.SEARCH },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Operations", routeKey: ROUTES.SERVICES_OPERATIONS },
      {
        label: "Training · National",
        routeKey: ROUTES.SERVICES_TRAINING_NATIONAL,
      },
      {
        label: "Training · International",
        routeKey: ROUTES.SERVICES_TRAINING_INTERNATIONAL,
      },
      {
        label: "Collaboration · National",
        routeKey: ROUTES.SERVICES_COLLAB_NATIONAL,
      },
      {
        label: "Collab · SACEP",
        routeKey: ROUTES.SERVICES_COLLAB_INT_SACEP,
      },
      {
        label: "Collab · Colombo Sec. Conclave",
        routeKey: ROUTES.SERVICES_COLLAB_INT_COLOMBO,
      },
    ],
  },
  {
    title: "Documents",
    links: [
      { label: "OPRC Level-1", routeKey: ROUTES.DOC_OPRC_1 },
      { label: "OPRC Level-2", routeKey: ROUTES.DOC_OPRC_2 },
      { label: "OPRC Level-3", routeKey: ROUTES.DOC_OPRC_3 },
      { label: "OPRC PR Capsule", routeKey: ROUTES.DOC_OPRC_PR },
    ],
  },
  {
    title: "Other_Documents",
    links: [
      { label: "NOSDCP", routeKey: ROUTES.DOC_NOSDCP },
      { label: "CNA", routeKey: ROUTES.DOC_CNA },
      { label: "HNS", routeKey: ROUTES.DOC_HNS },
      { label: "WERCOS", routeKey: ROUTES.DOC_WERCOS },
      { label: "OSD Policy", routeKey: ROUTES.DOC_OSD_POLICY },
      { label: "Incident Reports", routeKey: ROUTES.DOC_INCIDENT_REPORTS },
    ],
  },
];

export default function Footer() {
  const [open, setOpen] = useState({});
  const { navigate } = useRoute();

  function toggle(idx) {
    setOpen((s) => ({ ...s, [idx]: !s[idx] }));
  }

  function handleLinkClick(routeKey) {
    if (!routeKey) return;
    navigate(routeKey);
  }

  return (
    <footer
      className="
        mt-12
        border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.04)]
        bg-[var(--bg-light)] dark:bg-[var(--bg-dark)]
        text-[var(--navy)] dark:text-[var(--soft-white)]
      "
      aria-labelledby="footer-heading"
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* top badge + tagline */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div
              className="w-15 h-18 rounded-full flex items-center justify-center text-white font-bold"
            >
              <img
                      src={icgLogo}
                      alt="PRABAL background"
                      className="h-full w-full object-fit brightness-75 saturate-150"
                    />
            </div>

            <div>
              <h3
                id="footer-heading"
                className="text-lg font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]"
              >
                PRABAL
              </h3>
              <p className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                Pollution Response Abate and Library • Secure offline file search & access
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-150"
          >
            <div className="rounded-md overflow-hidden bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] p-3 flex items-center gap-3">
              <div className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                Operational Notice:
              </div>
              <div className="flex-1 text-sm">
                <div className="overflow-hidden">
                  <div className="whitespace-nowrap animate-marquee2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                    For Use Of CGPRT Only — <span className="h-2 w-20"></span> For Use Of CGPRT Only —
                  </div>
                </div>
              </div>
              <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                v1.0.0
              </div>
            </div>
          </motion.div>
        </div>

        {/* link grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {LINK_SECTIONS.map((sec, idx) => (
            <div key={sec.title}>
              {/* desktop heading + links (buttons for internal routes) */}
              <div className="hidden md:block">
                <h4 className="text-sm font-semibold mb-3 text-[var(--navy)] dark:text-[var(--soft-white)]">
                  {sec.title}
                </h4>
                <ul className="space-y-2">
                  {sec.links.map((l) => (
                    <li key={l.label}>
                      {l.routeKey ? (
                        <button
                          type="button"
                          onClick={() => handleLinkClick(l.routeKey)}
                          className="text-sm hover:underline text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                        >
                          {l.label}
                        </button>
                      ) : (
                        <a
                          href={l.href || "#"}
                          className="text-sm hover:underline text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                        >
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* mobile accordion */}
              <div className="md:hidden">
                <button
                  className="w-full flex items-center justify-between py-2"
                  aria-expanded={!!open[idx]}
                  onClick={() => toggle(idx)}
                >
                  <span className="text-sm font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">
                    {sec.title}
                  </span>
                  <ChevronDown
                    className={`transform transition-transform ${
                      open[idx] ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: open[idx] ? "auto" : 0,
                    opacity: open[idx] ? 1 : 0,
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <ul className="pl-0 mt-2 space-y-2">
                    {sec.links.map((l) => (
                      <li key={l.label}>
                        {l.routeKey ? (
                          <button
                            type="button"
                            onClick={() => handleLinkClick(l.routeKey)}
                            className="text-sm block py-1 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] text-left w-full"
                          >
                            {l.label}
                          </button>
                        ) : (
                          <a
                            href={l.href || "#"}
                            className="text-sm block py-1 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                          >
                            {l.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* divider */}
        <div className="mt-8 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.04)] pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
              © {new Date().getFullYear()} COAST GUARD — For Use Of CGPRT Only
            </div>

            <div className="flex items-center gap-4">
              {/* these can later be wired to real routes if you add them to ROUTES */}
              <a
                className="text-sm hover:underline text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                href="#"
              >
                Privacy
              </a>
              <a
                className="text-sm hover:underline text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                href="#"
              >
                Terms
              </a>
              <a
                className="text-sm hover:underline text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]"
                href="#"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
