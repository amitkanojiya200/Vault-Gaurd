// src/components/NavBar.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  Folder,
} from "lucide-react";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import HeroImg from "../assets/icg-logo.png";
import { useRoute, ROUTES } from "../router/Router";

// 🔄 real auth + session
import sessionClient from "@/lib/sessionClient";
import * as userClient from "@/lib/userClient";
import * as authClient from "@/lib/authClient";

// Stakeholder-specific OPRC pages (separate from Documents > OPRC pages)
const STAKEHOLDERS_LIST = [
  {
    key: "stake-oprc-level1",
    label: "OPRC Level1 stakeholder",
    routeKey: ROUTES.STAKE_OPRC_LEVEL1,
  },
  {
    key: "stake-oprc-level2",
    label: "OPRC Level2 stakeholder",
    routeKey: ROUTES.STAKE_OPRC_LEVEL2,
  },
  {
    key: "stake-oprc-level3",
    label: "OPRC Level3 stakeholder",
    routeKey: ROUTES.STAKE_OPRC_LEVEL3,
  },
];


export default function NavBar() {
  const { route, navigate } = useRoute();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState(null); // 'services' | 'documents' | 'stakeholders' | null
  const [openServicesKey, setOpenServicesKey] = React.useState(null); // which Services sub-group is expanded
  const [openServicesSubKey, setOpenServicesSubKey] = React.useState(null); // for Services > Collaboration > International

  // ✅ current user from real backend session
  const [currentUser, setCurrentUserState] = React.useState(null);

  useEffect(() => {
    let mounted = true;

    async function reloadUserFromSession() {
      try {
        const token = await sessionClient.getSessionToken();
        if (!token) {
          if (mounted) setCurrentUserState(null);
          return;
        }

        let user = null;
        if (userClient.validateSession) {
          user = await userClient.validateSession(token);
        }

        if (mounted && user) {
          setCurrentUserState({ ...user, token });
        }
      } catch (err) {
        console.error("[NavBar] Failed to load current user from session:", err);
        try {
          await sessionClient.clearSessionToken();
        } catch (_) {
          // ignore
        }
        if (mounted) setCurrentUserState(null);
      }
    }

    // run once on mount
    reloadUserFromSession();

    // run again whenever Login fires "session-updated"
    const handler = () => {
      reloadUserFromSession();
    };
    window.addEventListener("session-updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("session-updated", handler);
    };
  }, []);

  const navRef = React.useRef(null);
  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setOpenServicesKey(null);
        setOpenServicesSubKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
    // reset nested states when switching dropdown
    if (key !== "services") {
      setOpenServicesKey(null);
      setOpenServicesSubKey(null);
    }
  };

  const toggleServicesGroup = (key) => {
    setOpenServicesKey((prev) => (prev === key ? null : key));
    setOpenServicesSubKey(null); // reset sub-group
  };

  const toggleServicesSubGroup = (key) => {
    setOpenServicesSubKey((prev) => (prev === key ? null : key));
  };

  const navTo = (routeKey) => {
    // Close menus
    setMobileOpen(false);
    setOpenDropdown(null);
    setOpenServicesKey(null);
    setOpenServicesSubKey(null);
    if (routeKey) navigate(routeKey);
  };

  const isActive = (key) => route === key;

  async function handleLogout() {
    try {
      const token = await sessionClient.getSessionToken();
      if (token && authClient.authLogout) {
        try {
          await authClient.authLogout(token);
        } catch (e) {
          console.warn("[NavBar] authLogout failed (non-fatal):", e);
        }
      }
      await sessionClient.clearSessionToken();
    } catch (e) {
      console.error("[NavBar] logout failed:", e);
    } finally {
      // 🔔 broadcast
      window.dispatchEvent(
        new CustomEvent("session-updated", { detail: { status: "logged-out" } })
      );

      setCurrentUserState(null);
      navTo(ROUTES.LOGIN);
    }
  }

  // Shared classes
  const topBg =
    "bg-white/95 border-b border-slate-200 shadow-md shadow-slate-300/40 dark:bg-slate-950/95 dark:border-slate-800 dark:shadow-black/40";

  const navLinkBase =
    "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors";
  const navLinkActive =
    "bg-sky-50 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200";
  const navLinkIdle =
    "text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70";

  const dropdownPanelBase =
    "absolute left-1/2 -translate-x-1/2 mt-2 min-w-[260px] rounded-2xl border border-slate-200 bg-white/98 p-3 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-slate-900/98 dark:shadow-black/40";

  return (
    <>
      {/* fixed top nav */}
      <header ref={navRef} className={`z-40 -mb-15 ${topBg}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          {/* Left: logo + text */}
          <button
            type="button"
            onClick={() => navTo(ROUTES.HOME)}
            className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <img
                src={HeroImg}
                alt="ICG emblem"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                PRABAL
              </div>
              <div className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                Indian Coast Guard · Local Intel Vault
              </div>
            </div>
          </button>

          {/* Center: main nav (desktop) */}
          <nav className="hidden items-center gap-2 md:flex">
            {/* Home */}
            <button
              type="button"
              onClick={() => navTo(ROUTES.HOME)}
              className={`${navLinkBase} ${isActive(ROUTES.HOME) ? navLinkActive : navLinkIdle
                }`}
            >
              <span>Home</span>
            </button>

            {/* Services */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("services")}
                className={`${navLinkBase} ${openDropdown === "services" ? navLinkActive : navLinkIdle
                  }`}
              >
                <span>Services</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${openDropdown === "services" ? "rotate-180" : ""
                    }`}
                />
              </button>

              <AnimatePresence>
                {openDropdown === "services" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className={dropdownPanelBase}
                  >
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Services
                    </p>

                    <div className="space-y-1 text-sm">
                      {/* Operations (no nested) */}
                      <button
                        type="button"
                        onClick={() => navTo(ROUTES.SERVICES_OPERATIONS)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                      >
                        <span>Operations</span>
                      </button>

                      {/* Training (accordion) */}
                      <div className="rounded-lg bg-slate-50/70 p-2 dark:bg-slate-900/60">
                        <button
                          type="button"
                          onClick={() =>
                            toggleServicesGroup("services-training")
                          }
                          className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800/80"
                        >
                          <span>Training</span>
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${openServicesKey === "services-training"
                              ? "rotate-180"
                              : ""
                              }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openServicesKey === "services-training" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.16 }}
                              className="mt-1 space-y-1 pl-2 text-[0.8rem]"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navTo(ROUTES.SERVICES_TRAINING_NATIONAL)
                                }
                                className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                              >
                                National Level
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navTo(ROUTES.SERVICES_TRAINING_INTERNATIONAL)
                                }
                                className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                              >
                                International Level
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Collaboration (accordion with third level) */}
                      <div className="rounded-lg bg-slate-50/70 p-2 dark:bg-slate-900/60">
                        <button
                          type="button"
                          onClick={() =>
                            toggleServicesGroup("services-collab")
                          }
                          className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800/80"
                        >
                          <span>Collaboration</span>
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${openServicesKey === "services-collab"
                              ? "rotate-180"
                              : ""
                              }`}
                          />
                        </button>

                        <AnimatePresence>
                          {openServicesKey === "services-collab" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.16 }}
                              className="mt-1 space-y-1 pl-2 text-[0.8rem]"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navTo(ROUTES.SERVICES_COLLAB_NATIONAL)
                                }
                                className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                              >
                                National
                              </button>

                              {/* International sub-group */}
                              <div className="rounded-md bg-slate-50/90 p-1 dark:bg-slate-900/80">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleServicesSubGroup(
                                      "collab-international"
                                    )
                                  }
                                  className="flex w-full items-center justify-between rounded px-1 py-1 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/90"
                                >
                                  <span>International</span>
                                  <ChevronDown
                                    size={13}
                                    className={`transition-transform ${openServicesSubKey ===
                                      "collab-international"
                                      ? "rotate-180"
                                      : ""
                                      }`}
                                  />
                                </button>
                                <AnimatePresence>
                                  {openServicesSubKey ===
                                    "collab-international" && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{
                                          opacity: 1,
                                          height: "auto",
                                        }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.16 }}
                                        className="mt-1 space-y-1 pl-2"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            navTo(
                                              ROUTES.SERVICES_COLLAB_INT_SACEP
                                            )
                                          }
                                          className="block w-full rounded px-1 py-1 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                                        >
                                          SACEP
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            navTo(
                                              ROUTES.SERVICES_COLLAB_INT_COLOMBO
                                            )
                                          }
                                          className="block w-full rounded px-1 py-1 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80"
                                        >
                                          Colombo Security Conclave
                                        </button>
                                      </motion.div>
                                    )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Documents */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("documents")}
                className={`${navLinkBase} ${openDropdown === "documents" ? navLinkActive : navLinkIdle
                  }`}
              >
                <span>Documents</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${openDropdown === "documents" ? "rotate-180" : ""
                    }`}
                />
              </button>

              <AnimatePresence>
                {openDropdown === "documents" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className={`${dropdownPanelBase} max-h-72 overflow-y-auto`}
                  >
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Documents
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_OPRC_11)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          OPRC Level-1
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_OPRC_22)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          OPRC Level-2
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_OPRC_33)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          OPRC Level-3
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_OPRC_PRR)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          OPRC PR Capsule
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_NOSDCP)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          NOSDCP
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_CNA)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          CNA
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_HNS)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          HNS
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_WERCOS)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          WERCOS
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_OSD_POLICY)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          OSD Policy
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => navTo(ROUTES.DOC_INCIDENT_REPORTS)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          Incident Reports
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stakeholders */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("stakeholders")}
                className={`${navLinkBase} ${openDropdown === "stakeholders"
                  ? navLinkActive
                  : navLinkIdle
                  }`}
              >
                <span>Stakeholders</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${openDropdown === "stakeholders" ? "rotate-180" : ""
                    }`}
                />
              </button>

              <AnimatePresence>
                {openDropdown === "stakeholders" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className={`${dropdownPanelBase} w-64`}
                  >
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Stakeholder · OPRC Levels
                    </p>
                    <ul className="space-y-1 text-sm">
                      {STAKEHOLDERS_LIST.map((s) => (
                        <li key={s.key}>
                          <button
                            type="button"
                            onClick={() => navTo(s.routeKey)}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                          >
                            {s.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Desktop actions */}
            <div className="hidden items-center gap-2 sm:flex">
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navTo(ROUTES.DASHBOARD)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:text-slate-950"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </button>
              )}
              {/* Explorer and Search always available to logged users */}
              {/* Explorer */}
              <button
                type="button"
                onClick={() => navTo(ROUTES.EXPLORER)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500"
              >
                <Folder size={15} />
                Explorer
              </button>

              <button
                type="button"
                onClick={() => navTo(ROUTES.PROFILE)}
                className="rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>

              {currentUser ? (
                <>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {currentUser.name} ({currentUser.role})
                  </span>
                  <button onClick={handleLogout} className="rounded-md border px-3 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                    Logout
                  </button>
                </>
              ) : (
                <button onClick={() => navTo(ROUTES.LOGIN)} className="rounded-md border px-3 py-1 text-xs">
                  Login
                </button>
              )}
              <AnimatedThemeToggler />
            </div>

            {/* Mobile: menu + theme toggler */}
            <div className="flex items-center gap-2 sm:hidden">
              <AnimatedThemeToggler />
              <button
                type="button"
                onClick={() => {
                  setMobileOpen((prev) => !prev);
                  setOpenDropdown(null);
                }}
                className="rounded-md border border-slate-300 bg-white p-2 text-slate-800 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="border-t border-slate-200 bg-white/98 px-4 py-3 text-sm shadow-md shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/98 dark:shadow-black/40 md:hidden"
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navTo(ROUTES.HOME)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Home
                </button>

                {/* Simple mobile shortcuts */}
                <button
                  type="button"
                  onClick={() => navTo(ROUTES.SERVICES_OPERATIONS)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Services · Operations
                </button>
                <button
                  type="button"
                  onClick={() => navTo(ROUTES.SERVICES_TRAINING_NATIONAL)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Services · Training
                </button>
                <button
                  type="button"
                  onClick={() => navTo(ROUTES.SERVICES_COLLAB_NATIONAL)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Services · Collaboration
                </button>

                <button
                  type="button"
                  onClick={() => navTo(ROUTES.DOC_NOSDCP)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Documents
                </button>

                <button
                  type="button"
                  onClick={() => navTo(ROUTES.STAKEHOLDERS)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                >
                  Stakeholders
                </button>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navTo(ROUTES.EXPLORER)}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80"
                  >
                    Explorer
                  </button>

                  <button
                    type="button"
                    onClick={() => navTo(ROUTES.DASHBOARD)}
                    className="flex-1 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 dark:bg-sky-500 dark:text-slate-950"
                  >
                    Dashboard
                  </button>

                  {currentUser ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500"
                    >
                      Logout
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navTo(ROUTES.LOGIN)}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer so content doesn't slide under fixed navbar */}
      <div className="h-16 md:h-16" />
    </>
  );
}