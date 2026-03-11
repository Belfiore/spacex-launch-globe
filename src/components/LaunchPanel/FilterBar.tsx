"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SITE_GROUPS } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import Tooltip from "@/components/UI/Tooltip";

const ROCKET_TYPES = ["Falcon 9", "Falcon Heavy", "Starship", "Falcon 1"];
const STATUSES = ["upcoming", "success", "failure"];

/** Short tooltip descriptions for each filter */
const TOOLTIPS: Record<string, string> = {
  // Rocket types
  "Falcon 9": "Workhorse medium-lift rocket",
  "Falcon Heavy": "Triple-booster heavy-lift rocket",
  "Starship": "Super heavy-lift next-gen vehicle",
  "Falcon 1": "SpaceX's first small-lift rocket",
  // Statuses
  "upcoming": "Scheduled future launches",
  "success": "Mission objectives achieved",
  "failure": "Vehicle or mission loss",
  // Sites
  "CC": "Cape Canaveral, Florida",
  "BC": "Boca Chica / Starbase, Texas",
  "V": "Vandenberg SFB, California",
  "OI": "Omelek Island, Kwajalein Atoll",
  // Special
  "jellyfish": "Exhaust plume glows in twilight sunlight",
  "clear": "Remove all active filters",
};

export default function FilterBar() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const selectedYear = useAppStore((s) => s.selectedYear);
  const setSelectedYear = useAppStore((s) => s.setSelectedYear);
  const availableYears = useAppStore((s) => s.availableYears);
  const setTimelineDate = useAppStore((s) => s.setTimelineDate);
  const isMobile = useIsMobile();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.rocketType ||
    filters.status ||
    filters.site ||
    filters.sites.length > 0 ||
    filters.jellyfish;

  const activeFilterCount = [
    filters.rocketType,
    filters.status,
    filters.site,
    filters.sites.length > 0,
    filters.jellyfish,
  ].filter(Boolean).length;

  function toggleSite(key: string) {
    const current = filters.sites;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setFilters({ sites: next });
  }

  const chipPadding = isMobile ? "6px 12px" : "3px 8px";

  return (
    <div
      style={{
        padding: isMobile ? "8px 12px" : "10px 14px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      {/* Year dropdown — above search */}
      <select
        value={selectedYear}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "all") {
            setSelectedYear("all");
            setTimelineDate(new Date());
          } else {
            const year = Number(val);
            setSelectedYear(year);
            const now = new Date();
            if (year === now.getFullYear()) {
              setTimelineDate(now);
            } else {
              setTimelineDate(new Date(year, 6, 1));
            }
          }
        }}
        style={{
          padding: isMobile ? "7px 6px" : "4px 6px",
          borderRadius: isMobile ? "6px" : "4px",
          border: "1px solid rgba(34, 211, 238, 0.3)",
          background: "rgba(34, 211, 238, 0.08)",
          color: "#22d3ee",
          cursor: "pointer",
          fontSize: isMobile ? "12px" : "11px",
          fontWeight: 600,
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
        }}
      >
        <option value="all" style={{ background: "#0a0e1a", color: "#e2e8f0" }}>
          All Years
        </option>
        {availableYears.map((year) => (
          <option key={year} value={year} style={{ background: "#0a0e1a", color: "#e2e8f0" }}>
            {year}
          </option>
        ))}
      </select>

      {/* Row 2: Search + mobile filters toggle */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            type="text"
            placeholder="Search missions..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            style={{
              width: "100%",
              padding: "7px 10px 7px 30px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "#e2e8f0",
              fontSize: "12px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "rgba(34, 211, 238, 0.3)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "rgba(255, 255, 255, 0.08)")
            }
          />
          <span
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "12px",
              opacity: 0.4,
            }}
          >
            {"🔍"}
          </span>
        </div>
        {/* Mobile: Filters toggle button */}
        {isMobile && (
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: `1px solid ${hasActiveFilters || filtersExpanded ? "rgba(34, 211, 238, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
              background: hasActiveFilters || filtersExpanded ? "rgba(34, 211, 238, 0.1)" : "rgba(255, 255, 255, 0.02)",
              color: hasActiveFilters || filtersExpanded ? "#22d3ee" : "#64748b",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} {filtersExpanded ? "\u25B4" : "\u25BE"}
          </button>
        )}
      </div>

      {/* Filter chips — always shown on desktop, collapsible on mobile */}
      {(!isMobile || filtersExpanded) && (
      <div
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          fontSize: "10px",
          alignItems: "center",
        }}
      >
        {/* Rocket types */}
        {ROCKET_TYPES.map((type) => (
          <Tooltip key={type} text={TOOLTIPS[type]}>
          <button
            onClick={() =>
              setFilters({
                rocketType: filters.rocketType === type ? null : type,
              })
            }
            style={{
              padding: chipPadding,
              borderRadius: "4px",
              border: `1px solid ${
                filters.rocketType === type
                  ? "rgba(34, 211, 238, 0.4)"
                  : "rgba(255, 255, 255, 0.08)"
              }`,
              background:
                filters.rocketType === type
                  ? "rgba(34, 211, 238, 0.1)"
                  : "rgba(255, 255, 255, 0.02)",
              color:
                filters.rocketType === type ? "#22d3ee" : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontWeight: filters.rocketType === type ? 600 : 400,
            }}
          >
            {type}
          </button>
          </Tooltip>
        ))}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Status */}
        {STATUSES.map((status) => (
          <Tooltip key={status} text={TOOLTIPS[status]}>
          <button
            onClick={() =>
              setFilters({
                status: filters.status === status ? null : status,
              })
            }
            style={{
              padding: chipPadding,
              borderRadius: "4px",
              border: `1px solid ${
                filters.status === status
                  ? "rgba(34, 211, 238, 0.4)"
                  : "rgba(255, 255, 255, 0.08)"
              }`,
              background:
                filters.status === status
                  ? "rgba(34, 211, 238, 0.1)"
                  : "rgba(255, 255, 255, 0.02)",
              color:
                filters.status === status ? "#22d3ee" : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textTransform: "capitalize",
              fontWeight: filters.status === status ? 600 : 400,
            }}
          >
            {status}
          </button>
          </Tooltip>
        ))}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Site groups — multi-select with per-site colors */}
        {SITE_GROUPS.map((group) => {
          const isActive = filters.sites.includes(group.key);
          return (
            <Tooltip key={group.key} text={TOOLTIPS[group.key]}>
            <button
              onClick={() => toggleSite(group.key)}
              style={{
                padding: chipPadding,
                borderRadius: "4px",
                border: `1px solid ${
                  isActive ? `${group.color}66` : "rgba(255, 255, 255, 0.08)"
                }`,
                background: isActive
                  ? `${group.color}18`
                  : "rgba(255, 255, 255, 0.02)",
                color: isActive ? group.color : "#64748b",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontWeight: isActive ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {/* Colored dot indicator */}
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: group.color,
                  opacity: isActive ? 1 : 0.4,
                  flexShrink: 0,
                }}
              />
              {group.key}
            </button>
            </Tooltip>
          );
        })}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Jellyfish filter */}
        <Tooltip text={TOOLTIPS["jellyfish"]}>
        <button
          onClick={() => setFilters({ jellyfish: !filters.jellyfish })}
          style={{
            padding: chipPadding,
            borderRadius: "4px",
            border: `1px solid ${
              filters.jellyfish
                ? "rgba(168, 85, 247, 0.5)"
                : "rgba(255, 255, 255, 0.08)"
            }`,
            background: filters.jellyfish
              ? "rgba(168, 85, 247, 0.15)"
              : "rgba(255, 255, 255, 0.02)",
            color: filters.jellyfish ? "#c084fc" : "#64748b",
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontWeight: filters.jellyfish ? 600 : 400,
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#a855f7",
              opacity: filters.jellyfish ? 1 : 0.4,
              flexShrink: 0,
            }}
          />
          JF
        </button>
        </Tooltip>

        {/* Clear */}
        {hasActiveFilters && (
          <Tooltip text={TOOLTIPS["clear"]}>
          <button
            onClick={resetFilters}
            style={{
              padding: chipPadding,
              borderRadius: "4px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "10px",
              transition: "all 0.15s ease",
            }}
          >
            Clear
          </button>
          </Tooltip>
        )}
      </div>
      )}
    </div>
  );
}
