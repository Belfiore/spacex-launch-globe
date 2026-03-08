"use client";

import { useAppStore } from "@/store/useAppStore";
import { SITE_GROUPS } from "@/lib/constants";

const ROCKET_TYPES = ["Falcon 9", "Falcon Heavy", "Starship"];
const STATUSES = ["upcoming", "success", "failure"];

export default function FilterBar() {
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);

  const hasActiveFilters =
    filters.search ||
    filters.rocketType ||
    filters.status ||
    filters.site ||
    filters.sites.length > 0 ||
    filters.jellyfish;

  function toggleSite(key: string) {
    const current = filters.sites;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setFilters({ sites: next });
  }

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      {/* Search */}
      <div style={{ position: "relative" }}>
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
          🔍
        </span>
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          fontSize: "10px",
        }}
      >
        {/* Rocket types */}
        {ROCKET_TYPES.map((type) => (
          <button
            key={type}
            onClick={() =>
              setFilters({
                rocketType: filters.rocketType === type ? null : type,
              })
            }
            style={{
              padding: "3px 8px",
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
        ))}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Status */}
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() =>
              setFilters({
                status: filters.status === status ? null : status,
              })
            }
            style={{
              padding: "3px 8px",
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
        ))}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Site groups — multi-select with per-site colors */}
        {SITE_GROUPS.map((group) => {
          const isActive = filters.sites.includes(group.key);
          return (
            <button
              key={group.key}
              onClick={() => toggleSite(group.key)}
              style={{
                padding: "3px 8px",
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
          );
        })}

        <span style={{ color: "#334155", margin: "0 2px" }}>|</span>

        {/* Jellyfish filter */}
        <button
          onClick={() => setFilters({ jellyfish: !filters.jellyfish })}
          style={{
            padding: "3px 8px",
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

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              padding: "3px 8px",
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
        )}
      </div>
    </div>
  );
}
