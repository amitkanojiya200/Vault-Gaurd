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
import ModalPdfViewer from '@/components/ModalPdfViewer';

// --- Stakeholder documents with exact names and paths ---
const STAKEHOLDER_DOCUMENTS = [
  { title: "HALDIA DOCK CO-OP SMPK", path: "/stakeholders/HALDIA_DOCK_CO-OP_SMPK.pdf" },
  { title: "FINOLEX, RATNAGIRI", path: "/stakeholders/FINOLEX_RATNAGIRI.pdf" },
  { title: "GAIL (INDIA) LTD, KOCHI (1)", path: "/stakeholders/GAIL_INDIA_LTD_KOCHI_1.pdf" },
  { title: "ESSAR BULK TERMINAL SALAYA LTD", path: "/stakeholders/ESSAR_BULK_TERMINAL_SALAYA_LTD.pdf" },
  { title: "DIRECTORATE OF FISHERIES GOA (2)", path: "/stakeholders/DIRECTORATE_OF_FISHERIES_GOA_2.pdf" },
  { title: "DIRECTORATE OF FISHERIES GOA (1)", path: "/stakeholders/DIRECTORATE_OF_FISHERIES_GOA_1.pdf" },
  { title: "DEENDAYAL PORT AUTHORITY", path: "/stakeholders/DEENDAYAL_PORT_AUTHORITY.pdf" },
  { title: "DGS. GOVT. OF INDIA (1)", path: "/stakeholders/DGS_GOVT_OF_INDIA_1.pdf" },
  { title: "DEENDAYAL PORT AUTHORITY 2", path: "/stakeholders/DEENDAYAL_PORT_AUTHORITY_2.pdf" },
  { title: "CAPTAIN OF PORT GOA", path: "/stakeholders/CAPTAIN_OF_PORT_GOA.pdf" },
  { title: "CHENNAI PRT TRUST", path: "/stakeholders/CHENNAI_PRT_TRUST.pdf" },
  { title: "CARNIVAL PORT AUTHORITY", path: "/stakeholders/CARNIVAL_PORT_AUTHORITY.pdf" },
  { title: "CAIRN VEDANTA OIL & GAS", path: "/stakeholders/CAIRN_VEDANTA_OIL_GAS.pdf" },
  { title: "BP CORPORATION LTD (1)", path: "/stakeholders/BP_CORPORATION_LTD_1.pdf" },
  { title: "BHARAT PETROLEUM", path: "/stakeholders/BHARAT_PETROLEUM.pdf" },
  { title: "ANGRE PORT PVT LTD (1)", path: "/stakeholders/ANGRE_PORT_PVT_LTD_1.pdf" },
  { title: "APM TERMINAL, MUMBAI", path: "/stakeholders/APM_TERMINAL_MUMBAI.pdf" },
  { title: "AEGIS LOGISTICS LIMITED", path: "/stakeholders/AEGIS_LOGISTICS_LIMITED.pdf" },
  { title: "ADANI PORT", path: "/stakeholders/ADANI_PORT.pdf" },
  { title: "ADANI MUNDRA PORT LTD", path: "/stakeholders/ADANI_MUNDRA_PORT_LTD.pdf" },
  { title: "ONGC Mumbai Level-1 Qualified stakeholders (2021-2025)", path: "/stakeholders/ONGC_Mumbai_Level-1_Qualified_stakeholders_2021-2025.pdf" },
  { title: "MS MANGALORE REFINERY AND PETROCHEMICALS LTD", path: "/stakeholders/MS_MANGALORE_REFINERY_AND_PETROCHEMICALS_LTD.pdf" },
  { title: "MS IOCL, MANGALORE", path: "/stakeholders/MS_IOCL_MANGALORE.pdf" },
  { title: "MS KONKAN LNG LTD", path: "/stakeholders/MS_KONKAN_LNG_LTD.pdf" },
  { title: "MS HPCL VISAKH REFINERY", path: "/stakeholders/MS_HPCL_VISAKH_REFINERY.pdf" },
  { title: "MS FINOLEX INDUSTRIES LTD, RATNAGIRI", path: "/stakeholders/MS_FINOLEX_INDUSTRIES_LTD_RATNAGIRI.pdf" },
  { title: "MS AMBUJA CEMENTS LTD", path: "/stakeholders/MS_AMBUJA_CEMENTS_LTD.pdf" },
  { title: "MS CAPTAIN OF PORT GOA", path: "/stakeholders/MS_CAPTAIN_OF_PORT_GOA.pdf" },
  { title: "MbPA Level-1 Qualified stakeholders (2021-2025)", path: "/stakeholders/MbPA_Level-1_Qualified_stakeholders_2021-2025.pdf" },
  { title: "MORMUGAO PORT AUTHORITY", path: "/stakeholders/MORMUGAO_PORT_AUTHORITY.pdf" },
  { title: "MPA GOA", path: "/stakeholders/MPA_GOA.pdf" },
  { title: "MS ADANI ELECTRICITY MUMBAI LTD DAHANU PORT", path: "/stakeholders/MS_ADANI_ELECTRICITY_MUMBAI_LTD_DAHANU_PORT.pdf" },
  { title: "MS BPCL, KOCHI", path: "/stakeholders/MS_BPCL_KOCHI.pdf" },
  { title: "JSW JAIGARH PORT", path: "/stakeholders/JSW_JAIGARH_PORT.pdf" },
  { title: "JSW STEEL LIMITED", path: "/stakeholders/JSW_STEEL_LIMITED.pdf" },
  { title: "JSW DHARAMTAR PORT", path: "/stakeholders/JSW_DHARAMTAR_PORT.pdf" },
  { title: "JNPA NAVI MUMBAI", path: "/stakeholders/JNPA_NAVI_MUMBAI.pdf" },
  { title: "GAIL (INDIA) LTD, KOCHI", path: "/stakeholders/GAIL_INDIA_LTD_KOCHI.pdf" },
  { title: "DGS. GOVT. OF INDIA", path: "/stakeholders/DGS_GOVT_OF_INDIA.pdf" },
  { title: "DIRECTORATE OF FISHERIES GOA", path: "/stakeholders/DIRECTORATE_OF_FISHERIES_GOA.pdf" },
  { title: "COCHIN PORT AUTHORITY", path: "/stakeholders/COCHIN_PORT_AUTHORITY.pdf" },
  { title: "BP CORPORATION LTD", path: "/stakeholders/BP_CORPORATION_LTD.pdf" },
  { title: "ANGRE PORT PVT LTD", path: "/stakeholders/ANGRE_PORT_PVT_LTD.pdf" },
  { title: "BHARAT PETROLEUM", path: "/stakeholders/BHARAT_PETROLEUM_2.pdf" }, // Note: duplicate name, different file
  { title: "ULTRATECH CEMENT", path: "/stakeholders/ULTRATECH_CEMENT.pdf" },
  { title: "SPTL (RELIANCE) JAMNAGAR", path: "/stakeholders/SPTL_RELIANCE_JAMNAGAR.pdf" },
  { title: "VEDANTA LIMITED", path: "/stakeholders/VEDANTA_LIMITED.pdf" },
  { title: "VISAKHAPATNAM Port Authority", path: "/stakeholders/VISAKHAPATNAM_Port_Authority.pdf" },
  { title: "HPCL – VISAKH REFINERY", path: "/stakeholders/HPCL_VISAKH_REFINERY.pdf" },
  { title: "SIKKA PORTS & TERMINAL LTD", path: "/stakeholders/SIKKA_PORTS_TERMINAL_LTD.pdf" },
  { title: "SHYAMA PRASAD MUKHERJI PORT AUTHORITY", path: "/stakeholders/SHYAMA_PRASAD_MUKHERJI_PORT_AUTHORITY.pdf" },
  { title: "SADHAV SHIPPING LTD", path: "/stakeholders/SADHAV_SHIPPING_LTD.pdf" },
  { title: "KONKAN LNG LTD", path: "/stakeholders/KONKAN_LNG_LTD.pdf" },
  { title: "JAWAHARLAL NEHRU PORT AUTHORITY", path: "/stakeholders/JAWAHARLAL_NEHRU_PORT_AUTHORITY.pdf" },
  { title: "COCHIN PORT AUTHORITY (1)", path: "/stakeholders/COCHIN_PORT_AUTHORITY_1.pdf" },
  { title: "AMBUJA CEMENTS LTD", path: "/stakeholders/AMBUJA_CEMENTS_LTD.pdf" },
  { title: "PIPAVAV PORT LTD", path: "/stakeholders/PIPAVAV_PORT_LTD.pdf" },
  { title: "PARADIP PORT AUTHORITY", path: "/stakeholders/PARADIP_PORT_AUTHORITY.pdf" },
  { title: "OSCT LLM INDIA LTD. MUMBAI", path: "/stakeholders/OSCT_LLM_INDIA_LTD_MUMBAI.pdf" },
  { title: "ONGC Mumbai Level-1 & 2 Qualified stakeholders (2021-2025)", path: "/stakeholders/ONGC_Mumbai_Level-1_2_Qualified_stakeholders_2021-2025.pdf" },
  { title: "OIL AND NATURAL GAS CORPORATION", path: "/stakeholders/OIL_AND_NATURAL_GAS_CORPORATION.pdf" },
  { title: "OFFSHORE OIL TERMINAL (DPA) VADINAR", path: "/stakeholders/OFFSHORE_OIL_TERMINAL_DPA_VADINAR.pdf" },
  { title: "NEW MANGALORE PORT AUTHORITY", path: "/stakeholders/NEW_MANGALORE_PORT_AUTHORITY.pdf" },
  { title: "NAVARA ENERGY LTD", path: "/stakeholders/NAVARA_ENERGY_LTD.pdf" },
  { title: "MORMUGAON PORT AUTHORITY 2", path: "/stakeholders/MORMUGAON_PORT_AUTHORITY_2.pdf" },
  { title: "MRPL", path: "/stakeholders/MRPL.pdf" },
  { title: "MbPA Level-1, 2 & 3 Qualified stakeholders (2021-2025)", path: "/stakeholders/MbPA_Level-1_2_3_Qualified_stakeholders_2021-2025.pdf" },
  { title: "KARIKAL PORT PVT", path: "/stakeholders/KARIKAL_PORT_PVT.pdf" },
  { title: "MS BPCL, KOCHI (1)", path: "/stakeholders/MS_BPCL_KOCHI_1.pdf" },
  { title: "KAMARAJAR PORT LTD., CHENNAI", path: "/stakeholders/KAMARAJAR_PORT_LTD_CHENNAI.pdf" },
  { title: "JSW STEEL LIMITED (1)", path: "/stakeholders/JSW_STEEL_LIMITED_1.pdf" },
  { title: "JSW, DHARAMTAR PORT", path: "/stakeholders/JSW_DHARAMTAR_PORT_2.pdf" },
  { title: "JSW JAIGARH PORT (1)", path: "/stakeholders/JSW_JAIGARH_PORT_1.pdf" },
  { title: "INDIVIDUAL", path: "/stakeholders/INDIVIDUAL.pdf" },
  { title: "INDIAN OIL CORPORATION LIMITED", path: "/stakeholders/INDIAN_OIL_CORPORATION_LIMITED.pdf" },
  { title: "IMC LTD., ENNORE, CHENNAI", path: "/stakeholders/IMC_LTD_ENNORE_CHENNAI.pdf" },
  { title: "HMEL MUNDRA", path: "/stakeholders/HMEL_MUNDRA.pdf" },
  { title: "HDC SMPK", path: "/stakeholders/HDC_SMPK.pdf" },
  { title: "HAZIRA PORT LTD", path: "/stakeholders/HAZIRA_PORT_LTD.pdf" }
];

// Create the navbar stakeholders list from the document titles
const NAVBAR_STAKEHOLDERS = STAKEHOLDER_DOCUMENTS.map(doc => doc.title);

export default function NavBar() {
  const { route, navigate } = useRoute();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState(null); // 'services' | 'documents' | 'stakeholders' | null
  const [openServicesKey, setOpenServicesKey] = React.useState(null); // which Services sub-group is expanded
  const [openServicesSubKey, setOpenServicesSubKey] = React.useState(null); // for Services > Collaboration > International
  const [openStakePdf, setOpenStakePdf] = React.useState(null); // { src, title } or null

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

  // Handle stakeholder document click
  const handleStakeholderClick = async (title) => {
    try {
      // Find the document in STAKEHOLDER_DOCUMENTS
      const doc = STAKEHOLDER_DOCUMENTS.find(d => d.title === title);
      
      if (!doc) {
        console.error('Stakeholder document not found:', title);
        return;
      }

      // Convert to absolute URL for browser
      const resolved = (typeof window !== 'undefined' && window.location && window.location.origin.startsWith('http') && doc.path.startsWith('/'))
        ? `${window.location.origin}${doc.path}`
        : doc.path;

      // Open in the modal viewer
      setOpenStakePdf({ src: resolved, title: doc.title });
    } catch (err) {
      console.error('Stakeholder click error:', err);
    }
  };

  // Close stakeholder PDF modal
  const closeStakePdfModal = () => {
    setOpenStakePdf(null);
  };

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
                className={`${navLinkBase} ${openDropdown === "stakeholders" ? navLinkActive : navLinkIdle}`}
              >
                <span>Stakeholders</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${openDropdown === "stakeholders" ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {openDropdown === "stakeholders" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className={`${dropdownPanelBase} w-80 max-h-72 overflow-y-auto`}
                  >
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Stakeholders · Quick List
                    </p>

                    <div className="space-y-1 text-sm">
                      {NAVBAR_STAKEHOLDERS.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await handleStakeholderClick(title);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/70"
                        >
                          <span className="truncate">{title}</span>
                        </button>
                      ))}
                    </div>
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

      {/* Stakeholder PDF Modal */}
      {openStakePdf && (
        <ModalPdfViewer
          title={openStakePdf.title}
          src={openStakePdf.src}
          onClose={closeStakePdfModal}
        />
      )}
    </>
  );
}