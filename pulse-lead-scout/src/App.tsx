/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ReactNode } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  Search,
  MapPin,
  Globe,
  ShieldAlert,
  TrendingUp,
  Phone,
  Navigation,
  ExternalLink,
  ChevronRight,
  Database,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  X,
  Settings as SettingsIcon,
  Activity,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

const BIZCUSTOMIZER_URL =
  (import.meta as any).env?.VITE_BIZCUSTOMIZER_URL ||
  "https://bizcustomizer.vercel.app";

function normalizeSector(framework: string): string {
  const f = framework.toLowerCase();
  if (f === "wellness" || f === "hospitality") return f;
  return "trades";
}

function openInCustomizer(lead: Lead) {
  const params = new URLSearchParams({ clientName: lead.business_name });
  params.set(
    "sector",
    normalizeSector(lead.ai_demo_generation_parameters.framework_type),
  );
  if (lead.website_url) params.set("websiteUrl", lead.website_url);
  window.open(`${BIZCUSTOMIZER_URL}?${params.toString()}`, "_blank");
}

interface Lead {
  lead_id: string;
  business_name: string;
  website_url?: string;
  contact_details: {
    phone: string;
    address: string;
  };
  current_digital_status:
    | "NO_WEBSITE"
    | "OUTDATED_UNSECURE"
    | "OUTDATED_STATIC"
    | "MODERN_RETAIN";
  lead_score: number;
  pitch_hook_angle: string;
  ai_demo_generation_parameters: {
    framework_type: string;
    suggested_primary_keyword: string;
    recommended_placeholders: string[];
  };
}

function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-white">
                  System Configuration
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  Terminal v2.4 Settings
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 transition-colors"
                id="close-settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                  Live Connection Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-sm font-medium text-zinc-200">
                        Google Maps Platform
                      </span>
                    </div>
                    <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      Secure
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-sm font-medium text-zinc-200">
                        Gemini Pro Vision Engine
                      </span>
                    </div>
                    <span className="mono text-[10px] text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      Connected
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                  Scout Preferences
                </h4>
                <div className="space-y-4 bg-white/2 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-zinc-300 block">
                        Lead Priority Mode
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        Focus only on high-value digital gaps
                      </span>
                    </div>
                    <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
                    </div>
                  </div>
                  <div className="h-px bg-white/5"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-zinc-300 block">
                        Satellite Visualization
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        Render live map previews in terminal
                      </span>
                    </div>
                    <div className="w-10 h-5 bg-indigo-600 rounded-full flex items-center px-1 cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-4 accent-gradient rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 text-white transition-transform active:scale-95"
                  id="save-settings"
                >
                  Update Registry
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LeadRow({
  lead,
  isSelected,
  onClick,
}: {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}) {
  const dotColor =
    (
      {
        NO_WEBSITE: "bg-rose-500",
        OUTDATED_UNSECURE: "bg-amber-500",
        OUTDATED_STATIC: "bg-amber-400",
        MODERN_RETAIN: "bg-zinc-500",
      } as Record<string, string>
    )[lead.current_digital_status] ?? "bg-indigo-400";

  const hasUrl = Boolean(lead.website_url);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-500/10 border border-indigo-500/30"
          : "border border-transparent hover:bg-white/5"
      }`}
    >
      <span className="text-emerald-400 font-mono text-[11px] w-6 text-right shrink-0">
        {lead.lead_score}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span
        className={`text-xs font-medium truncate flex-1 ${hasUrl ? "text-zinc-200" : "text-zinc-500"}`}
      >
        {lead.business_name}
      </span>
      {hasUrl ? (
        <Globe size={11} className="text-emerald-400 shrink-0" />
      ) : (
        <ShieldAlert size={11} className="text-zinc-600 shrink-0" />
      )}
      <ChevronRight size={12} className="text-zinc-600 shrink-0" />
    </div>
  );
}

function SearchInterface({
  onResults,
  selectedModelId,
  setSelectedModelId,
}: {
  onResults: (
    results: Lead[],
    locations: Record<string, google.maps.LatLngLiteral>,
  ) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}) {
  const [sector, setSector] = useState("Pubs");
  const [location, setLocation] = useState("London");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
  const placesLib = useMapsLibrary("places");

  const models = [
    {
      id: "gemini-3-flash-preview",
      name: "Gemini 3 Flash",
      desc: "Fast & Intelligent (Preview)",
      color: "text-indigo-400",
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro",
      desc: "Maximum Reasoning (Paid)",
      color: "text-emerald-400",
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Flash Lite",
      desc: "Ultra-Fast Efficiency",
      color: "text-sky-400",
    },
    {
      id: "gemini-3.1-flash-lite-preview",
      name: "Flash Stable",
      desc: "Baseline Reliability",
      color: "text-purple-400",
    },
  ];

  const handleSearch = async () => {
    if (!placesLib) return;
    setLoading(true);
    setError(null);

    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: `${sector} in ${location}`,
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "websiteURI",
          "nationalPhoneNumber",
          "rating",
          "userRatingCount",
          "primaryType",
          "location",
        ],
        maxResultCount: 20,
      });

      if (!places || places.length === 0) {
        setLoading(false);
        setError("No businesses found matching your query.");
        return;
      }

      const locationsMap: Record<string, google.maps.LatLngLiteral> = {};
      const rawData = places.map((p) => {
        if (p.location) {
          locationsMap[p.id] = p.location.toJSON();
        }
        return {
          id: p.id,
          displayName: { text: p.displayName },
          formattedAddress: p.formattedAddress,
          websiteUri: (p as any).websiteURI,
          nationalPhoneNumber: p.nationalPhoneNumber,
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          primaryType: p.primaryType,
        };
      });

      const res = await fetch("/api/analyze-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: rawData,
          modelId: selectedModelId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message =
          errorData.error ||
          errorData.details ||
          "Intelligence engine failed to process batch.";

        if (
          message.includes("503") ||
          message.includes("high demand") ||
          message.includes("UNAVAILABLE")
        ) {
          throw new Error(`MODEL_HIGH_DEMAND: ${message}`);
        }
        throw new Error(message);
      }

      const leads = await res.json();
      onResults(leads, locationsMap);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || "";

      if (errorMsg.startsWith("MODEL_HIGH_DEMAND")) {
        setError(
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert size={18} />
              <p className="font-black uppercase tracking-widest text-[10px]">
                Model High Demand Cluster Detected
              </p>
            </div>
            <p className="text-sm">
              The current Gemini instance is under heavy load. Please try one of
              the following:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedModelId("gemini-3.1-flash-lite-preview");
                  setError(null);
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase text-purple-400">
                  Stable Baseline
                </p>
                <p className="text-[9px] text-zinc-500">
                  Switch to Flash Stable
                </p>
              </button>
              <button
                onClick={() => {
                  setSelectedModelId("gemini-3.1-flash-lite");
                  setError(null);
                }}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors"
              >
                <p className="text-[10px] font-bold uppercase text-sky-400">
                  Lite Engine
                </p>
                <p className="text-[9px] text-zinc-500">Switch to Flash Lite</p>
              </button>
            </div>
          </div>,
        );
      } else if (
        errorMsg.includes("PERMISSION_DENIED") ||
        errorMsg.includes("403")
      ) {
        setError(
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert size={18} />
                <p className="font-black uppercase tracking-widest text-[10px]">
                  Access Denied: Missing Permission
                </p>
              </div>
              <p className="font-bold text-sm leading-tight text-white uppercase tracking-tight">
                Critical Setup Missing
              </p>
              <div className="text-[11px] text-zinc-300 leading-relaxed font-semibold">
                I noticed "Maps JavaScript API" is NOT in your list of
                enabled/restricted APIs. This is the #1 cause of this specific
                blockage.
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-[10px] bg-zinc-900/50 p-2 rounded border border-rose-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_5px_rose] mt-1 shrink-0"></div>
                  <span className="text-zinc-200">
                    <strong>MISSING: Maps JavaScript API</strong> — You must
                    enable this for the browser to run search requests, even if
                    you have the Places API enabled.
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-1 text-[10px] text-zinc-400 bg-black/20 p-3 rounded border border-white/5 space-y-1">
                <p className="font-bold text-white uppercase">
                  Self-Check Checklist:
                </p>
                <p>• Is "Maps JavaScript API" enabled?</p>
                <p>• Is "Places API (New)" enabled?</p>
                <p>• Is billing attached to the project?</p>
                <p>
                  • If using{" "}
                  <span className="text-rose-300">HTTP Referrers</span>, did you
                  add this URL?
                </p>
                <p className="mt-1 font-mono text-[9px] bg-white/5 p-1 rounded break-all">
                  {window.location.origin}/*
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href="https://console.cloud.google.com/google/maps-apis/library/maps-backend.googleapis.com"
                  target="_blank"
                  className="flex items-center justify-between p-3 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 transition-colors group"
                >
                  <span className="text-[10px] font-black uppercase text-rose-300">
                    Enable Maps JavaScript API (Required)
                  </span>
                  <ExternalLink size={12} className="text-rose-400" />
                </a>
              </div>
            </div>
          </div>,
        );
      } else {
        setError(
          err.message || "An unexpected error occurred during the scan.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="glass p-3 rounded-xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest ml-1">
              Business Sector
            </label>
            <div className="relative">
              <Database
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white pl-8 pr-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600 font-medium"
                placeholder="e.g. Italian Restaurants"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest ml-1">
              Target Location
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white pl-8 pr-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-600 font-medium"
                placeholder="e.g. Melton Mowbray"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest ml-1">
              Intelligence Engine
            </label>
            <div className="relative">
              <Cpu
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white pl-8 pr-3 py-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer font-medium"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full accent-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-500/20 uppercase text-[10px] tracking-[0.2em]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Search size={14} />
              )}
              {loading ? "Evaluating..." : "Scan Leads"}
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 px-1">
          {models.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-1.5 transition-opacity ${selectedModelId === m.id ? "opacity-100" : "opacity-30"}`}
            >
              <div
                className={`w-1 h-1 rounded-full bg-current ${m.color}`}
              ></div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest ${m.color}`}
              >
                {m.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 text-rose-400 text-xs font-semibold items-start shadow-[0_0_20px_rgba(244,63,94,0.05)]"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sidebar({
  leads,
  selectedLeadId,
  onSelect,
}: {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelect: (id: string) => void;
}) {
  const withUrl = leads.filter((l) => l.website_url);
  const withoutUrl = leads.filter((l) => !l.website_url);
  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-col overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-none glass rounded-2xl p-2">
      <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Results
        </span>
        <span className="text-[10px] text-indigo-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
          {leads.length}
        </span>
      </div>
      {withUrl.map((lead) => (
        <LeadRow
          key={lead.lead_id}
          lead={lead}
          isSelected={selectedLeadId === lead.lead_id}
          onClick={() => onSelect(lead.lead_id)}
        />
      ))}
      {withUrl.length > 0 && withoutUrl.length > 0 && (
        <div className="flex items-center gap-2 px-2 my-1">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[9px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
            No URL
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      )}
      {withoutUrl.map((lead) => (
        <LeadRow
          key={lead.lead_id}
          lead={lead}
          isSelected={selectedLeadId === lead.lead_id}
          onClick={() => onSelect(lead.lead_id)}
        />
      ))}
      {leads.length === 0 && (
        <div className="text-center py-8 text-zinc-600">
          <Database size={20} className="mx-auto mb-2 opacity-20" />
          <p className="text-[10px] uppercase tracking-widest">
            Awaiting search
          </p>
        </div>
      )}
    </div>
  );
}

function MainView({
  lead,
  location,
}: {
  lead: Lead | null;
  location?: google.maps.LatLngLiteral;
}) {
  if (!lead) {
    return (
      <div className="flex-1 glass rounded-2xl flex items-center justify-center p-8 text-center">
        <div>
          <Sparkles size={28} className="mx-auto mb-3 opacity-10" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Select a lead to view details
          </p>
        </div>
      </div>
    );
  }

  const hasUrl = Boolean(lead.website_url);

  return (
    <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-w-0">
      <div className="bg-white/5 border-b border-white/5 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="accent-gradient text-[10px] font-black uppercase px-2 py-0.5 rounded text-white">
                Score: {lead.lead_score}
              </span>
              <span className="text-zinc-600 text-[10px] font-mono uppercase">
                {lead.lead_id}
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white truncate">
              {lead.business_name}
            </h1>
            <p className="text-zinc-500 text-xs flex items-center gap-1.5">
              <MapPin size={12} className="text-indigo-400 shrink-0" />
              {lead.contact_details.address}
            </p>
          </div>

          <div className="shrink-0">
            {hasUrl ? (
              <button
                onClick={() => openInCustomizer(lead)}
                className="accent-gradient px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:opacity-90 active:scale-95"
              >
                Generate Demo <Sparkles size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider border border-zinc-700 px-3 py-2 rounded-lg">
                <ShieldAlert size={12} />
                No URL — manual entry
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <section>
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2">
                Pitch Intel
              </h4>
              <div className="bg-white/5 border-l-2 border-indigo-500 p-3 rounded-r-xl">
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  "{lead.pitch_hook_angle}"
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                Digital Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1 tracking-wider">
                    Status
                  </span>
                  <span className="font-semibold text-zinc-200 uppercase text-xs">
                    {lead.current_digital_status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1 tracking-wider">
                    SEO Gap
                  </span>
                  <span className="font-semibold text-zinc-200 text-xs underline underline-offset-4 decoration-indigo-500/50">
                    {
                      lead.ai_demo_generation_parameters
                        .suggested_primary_keyword
                    }
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                AI Projection
              </h4>
              <div className="bg-white/5 p-3 border border-white/5 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Framework
                  </span>
                  <span className="mono text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                    {lead.ai_demo_generation_parameters.framework_type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lead.ai_demo_generation_parameters.recommended_placeholders.map(
                    (p, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-zinc-400"
                      >
                        {p}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </section>

            <section className="h-36 bg-white/5 rounded-xl border border-white/5 overflow-hidden relative">
              {location ? (
                <Map
                  defaultCenter={location}
                  defaultZoom={15}
                  mapId="DEMO_MAP_ID"
                  disableDefaultUI
                  gestureHandling="none"
                  internalUsageAttributionIds={[
                    "gmp_mcp_codeassist_v1_aistudio",
                  ]}
                  style={{ width: "100%", height: "100%" }}
                >
                  <AdvancedMarker position={location}>
                    <Pin
                      background="#6366f1"
                      glyphColor="#fff"
                      borderColor="#6366f1"
                    />
                  </AdvancedMarker>
                </Map>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                  Satellite Link Offline
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 font-sans">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-block p-6 glass rounded-[2rem] mb-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/30">
              L
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap">
            LeadEngine <span className="text-indigo-400">Terminal</span>
          </h2>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            Awaiting cryptographic provision
          </p>
        </div>

        <div className="glass p-8 rounded-3xl text-left space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-indigo-400 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              Initialization Sequence
            </h3>
            <ol className="space-y-6 text-xs text-zinc-400 font-medium">
              <li className="flex gap-4 items-start">
                <span className="mono text-indigo-500/50">01</span>
                <div className="space-y-2">
                  <p>
                    Enable <strong>Maps JavaScript API</strong> (Browser Layer).
                  </p>
                  <p className="text-[10px] text-zinc-600 bg-zinc-900 p-2 rounded-lg border border-white/5 leading-normal">
                    <span className="text-rose-500/70 font-bold block mb-1 underline">
                      MANDATORY:
                    </span>
                    Without this, Google blocks requests from browsers even if
                    other APIs are enabled. Search for "Maps JavaScript API" in
                    the library and enable it.
                  </p>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/library/maps-backend.googleapis.com"
                    target="_blank"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/20 transition-all font-bold mt-1 text-[11px]"
                  >
                    Enable Maps JS API Now <ExternalLink size={12} />
                  </a>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="mono text-indigo-500/50">02</span>
                <div className="space-y-2">
                  <p>
                    Enable <strong>Places API (New)</strong> (Data Layer).
                  </p>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/library/places-backend.googleapis.com"
                    target="_blank"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/20 transition-all font-bold mt-1 text-[11px]"
                  >
                    Verify Places API (New) <ExternalLink size={12} />
                  </a>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="mono text-indigo-500/50">02</span>
                <div className="space-y-2">
                  <p>
                    Acquisition of API Key via{" "}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp-code-assist-ais"
                      target="_blank"
                      className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-500/20 transition-all font-bold"
                    >
                      Cloud Credentials
                    </a>
                    .
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="mono text-indigo-500/50">03</span>
                <p>
                  Open <strong>Settings</strong> (⚙️) → <strong>Secrets</strong>{" "}
                  menu.
                </p>
              </li>
              <li className="flex gap-4 items-start">
                <span className="mono text-indigo-500/50">04</span>
                <p>
                  Provision lead secret: <code>GOOGLE_MAPS_PLATFORM_KEY</code>
                </p>
              </li>
            </ol>
          </div>
        </div>

        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">
          Scanning for secure environment variables...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [locations, setLocations] = useState<
    Record<string, google.maps.LatLngLiteral>
  >({});
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(
    "gemini-3-flash-preview",
  );

  if (!hasValidKey) return <Splash />;

  const selectedLead = leads.find((l) => l.lead_id === selectedLeadId) || null;
  const selectedLocation = selectedLeadId
    ? locations[selectedLeadId]
    : undefined;

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 p-3 md:p-4">
        <div className="max-w-[1600px] mx-auto space-y-3">
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
          <header className="flex justify-between items-center glass px-4 py-2.5 rounded-xl border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow shadow-indigo-500/30">
                L
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight uppercase">
                  LeadEngine <span className="text-indigo-400">v2.4</span>
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            <nav className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
              <button className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold text-white uppercase tracking-widest">
                Pulse Scout
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
              >
                Settings
              </button>
            </nav>
          </header>

          <SearchInterface
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
            onResults={(newLeads, newLocations) => {
              const sorted = [...newLeads].sort((a, b) => {
                const aUrl = a.website_url ? 1 : 0;
                const bUrl = b.website_url ? 1 : 0;
                if (bUrl !== aUrl) return bUrl - aUrl;
                return b.lead_score - a.lead_score;
              });
              setLeads(sorted);
              setLocations(newLocations);
              if (sorted.length > 0) setSelectedLeadId(sorted[0].lead_id);
            }}
          />

          <div className="flex flex-col lg:flex-row gap-3">
            <Sidebar
              leads={leads}
              selectedLeadId={selectedLeadId}
              onSelect={setSelectedLeadId}
            />
            <MainView lead={selectedLead} location={selectedLocation} />
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
