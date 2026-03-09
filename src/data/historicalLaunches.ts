import type { Launch } from "@/lib/types";

/**
 * Historical launches with detailed flight history data.
 * Covers all 11 Falcon Heavy flights, all 11 Starship flights,
 * and ~15 notable Falcon 9 milestone launches.
 */
export const HISTORICAL_LAUNCHES: Launch[] = [
  // ═══════════════════════════════════════════════════════════════
  // FALCON HEAVY — 11 Flights (Feb 2018 – Oct 2024)
  // All from LC-39A, Kennedy Space Center
  // ═══════════════════════════════════════════════════════════════

  {
    id: "fh-demo",
    name: "FH Demo Mission",
    dateUtc: "2018-02-06T20:45:00.000Z",
    dateUnix: 1517949900,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "Heliocentric",
    details:
      "First Falcon Heavy flight. Launched Elon Musk's Tesla Roadster with Starman mannequin into heliocentric orbit.",
    webcastUrl: "https://www.youtube.com/watch?v=wbSwFU6tY1c",
    flightHistory: {
      flightNumber: 1,
      missionOutcome: "success",
      missionSummary:
        "Payload reached intended trajectory, slightly overshooting to near the asteroid belt rather than Mars orbit.",
      payloadInfo:
        "Tesla Roadster with Starman mannequin in spacesuit — now orbiting the Sun",
      customer: "SpaceX (Demo)",
      boosterRecovery: [
        {
          boosterId: "B1023",
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
          note: "Spectacular synchronized landing with B1025",
        },
        {
          boosterId: "B1025",
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
          note: "Spectacular synchronized landing with B1023",
        },
        {
          boosterId: "B1033",
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "failure",
          note:
            "Only 1 of 3 landing engines ignited; hit ocean at ~480 km/h, damaged drone ship",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "27 Merlin engines ignite" },
        {
          time: "T+2:30",
          event: "Side booster separation",
          detail: "Boosters flip and begin boostback burn",
        },
        { time: "T+3:30", event: "Center core separation" },
        {
          time: "T+7:58",
          event: "Side boosters land",
          detail: "Synchronized touchdown at LZ-1 & LZ-2",
        },
        { time: "T+8:19", event: "Center core landing attempt fails" },
        { time: "T+28:00", event: "Second stage burn complete" },
      ],
      notes: [
        "First-ever Falcon Heavy flight",
        "Most powerful operational rocket at the time (5M lbs thrust)",
        "Musk considered clearing the pad without damage a win",
        "Roadster is still orbiting the Sun today",
      ],
      significance: "First flight of Falcon Heavy",
    },
  },

  {
    id: "fh-arabsat6a",
    name: "Arabsat-6A",
    dateUtc: "2019-04-11T22:35:00.000Z",
    dateUnix: 1555022100,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GTO",
    details:
      "First commercial Falcon Heavy mission. All three boosters landed successfully for the first (and only) time.",
    webcastUrl: "https://www.youtube.com/watch?v=TXMGu2d8c8g",
    flightHistory: {
      flightNumber: 2,
      missionOutcome: "success",
      missionSummary: "Satellite delivered to target GTO orbit.",
      payloadInfo: "Arabsat-6A communications satellite (Saudi Arabia)",
      customer: "Arabsat",
      boosterRecovery: [
        {
          boosterId: "B1052",
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1053",
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1055",
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
          note:
            "First all-three-booster landing. Center core later tipped over at sea during transport due to rough seas.",
        },
      ],
      notes: [
        "First commercial Falcon Heavy mission",
        "Only time all three FH boosters landed successfully",
        "Center core lost at sea during transport despite successful landing",
      ],
      significance: "First commercial FH flight; only all-three landing",
    },
  },

  {
    id: "fh-stp2",
    name: "STP-2",
    dateUtc: "2019-06-25T06:30:00.000Z",
    dateUnix: 1561441800,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "LEO (multiple)",
    details:
      "Most complex FH mission — 25 small satellites deployed via 4 upper-stage burns over 6 hours.",
    webcastUrl: "https://www.youtube.com/watch?v=WxH4CAlhtiQ",
    flightHistory: {
      flightNumber: 3,
      missionOutcome: "success",
      missionSummary: "All 25 satellites successfully deployed.",
      payloadInfo:
        "25 small satellites including Deep Space Atomic Clock, LightSail 2, GPIM, DSX",
      customer: "U.S. DoD / NASA / Research institutions",
      boosterRecovery: [
        {
          boosterId: "B1052",
          flightNumber: 2,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
          note: "Reused from Arabsat-6A",
        },
        {
          boosterId: "B1053",
          flightNumber: 2,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
          note: "Reused from Arabsat-6A",
        },
        {
          boosterId: "B1057",
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "failure",
          note:
            "Missed drone ship — reentry damage caused control loss. SpaceX stopped center core recovery attempts after this.",
        },
      ],
      notes: [
        "Most complex FH mission: 4 burns over 6 hours",
        "3+ year gap before next FH launch",
        "Last FH center core recovery attempt",
      ],
    },
  },

  {
    id: "fh-ussf44",
    name: "USSF-44",
    dateUtc: "2022-11-01T17:41:00.000Z",
    dateUnix: 1667324460,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GEO",
    details:
      "First NSSL-certified FH flight. Debuted the B1064/B1065 booster pair that flew 6 missions total.",
    webcastUrl: "https://www.youtube.com/watch?v=pY628jRd6gM",
    flightHistory: {
      flightNumber: 4,
      missionOutcome: "success",
      missionSummary: "Classified payload delivered to geosynchronous orbit.",
      payloadInfo:
        "Classified USSF payload including TETRA 1 microsatellite (Boeing)",
      customer: "U.S. Space Force",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 1,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
          note: "Debut flight — would go on to fly 6 times total",
        },
        {
          boosterId: "B1065",
          flightNumber: 1,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
          note: "Debut flight — would go on to fly 6 times total",
        },
        {
          boosterId: "B1066",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
          note: "Stripped of legs and grid fins for maximum performance",
        },
      ],
      notes: [
        "First NSSL-certified FH launch",
        "Returned after 3-year 4-month gap",
        "Debuted the legendary B1064/B1065 booster pair",
      ],
      significance: "First national security FH launch",
    },
  },

  {
    id: "fh-ussf67",
    name: "USSF-67",
    dateUtc: "2023-01-15T22:56:00.000Z",
    dateUnix: 1673823360,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GEO",
    details:
      "Classified USSF payload, believed to include CBAS-2 military communications relay satellite.",
    webcastUrl: "https://www.youtube.com/watch?v=nfxyF1_Ylkk",
    flightHistory: {
      flightNumber: 5,
      missionOutcome: "success",
      missionSummary: "Classified payload delivered to geosynchronous orbit.",
      payloadInfo: "Classified — believed to include CBAS-2 satellite",
      customer: "U.S. Space Force",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 2,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1065",
          flightNumber: 2,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1071",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: [
        "Launched 11 weeks after USSF-44",
        "Second national security launch",
      ],
    },
  },

  {
    id: "fh-viasat3",
    name: "ViaSat-3 Americas",
    dateUtc: "2023-04-30T23:26:00.000Z",
    dateUnix: 1682896960,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GTO",
    details:
      "Launch successful. The ViaSat-3 satellite later experienced a reflector antenna deployment failure (unrelated to launch).",
    webcastUrl: "https://www.youtube.com/watch?v=YFbp6PVbJQA",
    flightHistory: {
      flightNumber: 6,
      missionOutcome: "success",
      missionSummary:
        "Satellite delivered to GTO. Post-launch antenna issue was a ViaSat manufacturing problem.",
      payloadInfo: "ViaSat-3 Americas broadband communications satellite",
      customer: "ViaSat",
      boosterRecovery: [
        {
          boosterId: "B1063",
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1067",
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1073",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: [
        "Different side booster pair from USSF missions",
        "Satellite antenna issue was a manufacturing problem, not SpaceX",
      ],
    },
  },

  {
    id: "fh-jupiter3",
    name: "EchoStar 24 / Jupiter 3",
    dateUtc: "2023-07-28T23:04:00.000Z",
    dateUnix: 1690585440,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GTO",
    details:
      "Heaviest geostationary satellite launched by Falcon Heavy (~9,200 kg).",
    webcastUrl: "https://www.youtube.com/watch?v=5ixbPMe6684",
    flightHistory: {
      flightNumber: 7,
      missionOutcome: "success",
      missionSummary:
        "Heaviest GEO satellite launched by FH, delivered to GTO.",
      payloadInfo:
        "EchoStar 24 (Jupiter 3) — one of the largest commercial comms satellites ever (~9,200 kg)",
      payloadMassKg: 9200,
      customer: "EchoStar/Hughes",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 3,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1065",
          flightNumber: 3,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1078",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: ["Heaviest geostationary satellite launched by Falcon Heavy"],
    },
  },

  {
    id: "fh-psyche",
    name: "Psyche",
    dateUtc: "2023-10-13T14:19:00.000Z",
    dateUnix: 1697206740,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "Interplanetary",
    details:
      "NASA mission to asteroid 16 Psyche — a metal-rich asteroid believed to be a protoplanet core. Arrival expected 2029.",
    webcastUrl: "https://www.youtube.com/watch?v=npIDMxrzm_o",
    flightHistory: {
      flightNumber: 8,
      missionOutcome: "success",
      missionSummary:
        "Psyche spacecraft separated and is en route to asteroid 16 Psyche (arrival 2029).",
      payloadInfo:
        "NASA Psyche spacecraft — studying a metal-rich asteroid believed to be a protoplanet core",
      customer: "NASA",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 4,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1065",
          flightNumber: 4,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1079",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: [
        "First FH interplanetary mission",
        "Also carried DSOC deep-space optical comms experiment",
      ],
      significance: "First Falcon Heavy interplanetary mission",
    },
  },

  {
    id: "fh-ussf52",
    name: "USSF-52 (X-37B)",
    dateUtc: "2023-12-28T20:07:00.000Z",
    dateUnix: 1703793720,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "High orbit (classified)",
    details:
      "X-37B military spaceplane OTV-7. First X-37B launch on FH. Returned March 2025 after 434 days.",
    webcastUrl: "",
    flightHistory: {
      flightNumber: 9,
      missionOutcome: "success",
      missionSummary:
        "X-37B deployed to higher orbit than previous missions. Returned to Earth March 2025 after 434 days.",
      payloadInfo:
        "Boeing X-37B spaceplane (OTV-7) with classified experiments and NASA Seeds-2",
      customer: "U.S. Space Force",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 5,
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1065",
          flightNumber: 5,
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1084",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: [
        "First X-37B launch on Falcon Heavy (previous: Atlas V / Falcon 9)",
        "FH's extra power allowed higher orbits than ever before",
        "Multiple launch delays; at least one engine replaced",
      ],
    },
  },

  {
    id: "fh-goesu",
    name: "GOES-U (GOES-19)",
    dateUtc: "2024-06-25T21:35:00.000Z",
    dateUnix: 1719351300,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "GTO",
    details:
      "Final GOES-R series weather satellite for NOAA. Now operational as GOES-19.",
    webcastUrl: "",
    flightHistory: {
      flightNumber: 10,
      missionOutcome: "success",
      missionSummary:
        "GOES-U delivered to GTO. Now operational as GOES-19, extending weather monitoring through 2036.",
      payloadInfo:
        "GOES-U — 4th and final GOES-R series next-gen weather satellite",
      customer: "NOAA / NASA",
      boosterRecovery: [
        {
          boosterId: "B1072",
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1086",
          landingType: "RTLS",
          landingLocation: "LZ-2, Cape Canaveral",
          outcome: "success",
        },
        {
          boosterId: "B1087",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean",
          outcome: "expended",
        },
      ],
      notes: [
        "Different booster pair from USSF/Psyche flights",
        "Extends NOAA weather monitoring through 2036",
      ],
    },
  },

  {
    id: "fh-europaclipper",
    name: "Europa Clipper",
    dateUtc: "2024-10-14T16:06:00.000Z",
    dateUnix: 1728921960,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.6041,
    },
    status: "success",
    rocketType: "Falcon Heavy",
    payloadOrbit: "Interplanetary (Jupiter)",
    details:
      "NASA's largest planetary science spacecraft. Fully expendable configuration — all 3 boosters sacrificed. Jupiter arrival 2030.",
    webcastUrl: "https://www.youtube.com/watch?v=lQToTWKwtuw",
    flightHistory: {
      flightNumber: 11,
      missionOutcome: "success",
      missionSummary:
        "Europa Clipper separated and is en route to Jupiter. Mars flyby completed March 2025.",
      payloadInfo:
        "NASA Europa Clipper — largest planetary science spacecraft ever (~6,065 kg, 100+ ft solar arrays, 9 instruments)",
      payloadMassKg: 6065,
      customer: "NASA",
      boosterRecovery: [
        {
          boosterId: "B1064",
          flightNumber: 6,
          landingType: "Expended",
          landingLocation: "Atlantic Ocean (~775 km downrange)",
          outcome: "expended",
          note:
            "6th and final flight. Stripped of landing legs for max performance.",
        },
        {
          boosterId: "B1065",
          flightNumber: 6,
          landingType: "Expended",
          landingLocation: "Atlantic Ocean (~775 km downrange)",
          outcome: "expended",
          note: "6th and final flight. Legendary booster pair retired.",
        },
        {
          boosterId: "B1089",
          landingType: "Expended",
          landingLocation: "Atlantic Ocean (~1,960 km downrange)",
          outcome: "expended",
        },
      ],
      notes: [
        "Fully expendable — all three boosters sacrificed for max performance",
        "Originally planned for SLS, switched to FH saving NASA ~$2 billion",
        "B1064/B1065 concluded 6-flight career (USSF-44 through Europa Clipper)",
        "Jupiter arrival April 2030 via Mars and Earth gravity assists",
      ],
      significance: "NASA's flagship Europa mission; fully expendable FH",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // STARSHIP — 11 Flights (Apr 2023 – Oct 2025)
  // All from Starbase, Boca Chica, Texas
  // ═══════════════════════════════════════════════════════════════

  {
    id: "starship-flight1",
    name: "Starship Flight 1",
    dateUtc: "2023-04-20T13:33:00.000Z",
    dateUnix: 1681998780,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "First-ever integrated Starship/Super Heavy flight. Multiple engine failures, vehicle tumbled, AFTS triggered at T+4 min. Pad severely damaged.",
    webcastUrl: "https://www.youtube.com/watch?v=_krgcofiM6M",
    flightHistory: {
      flightNumber: 1,
      missionOutcome: "failure",
      missionSummary:
        "Multiple Raptor engines failed. Vehicle tumbled at T+4 min. AFTS destroyed both stages over the Gulf of Mexico. Booster and ship never separated.",
      payloadInfo: "None (test flight)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B7",
          landingType: "N/A",
          landingLocation: "Gulf of Mexico",
          outcome: "failure",
          note: "Destroyed by AFTS — never separated from ship",
        },
        {
          boosterId: "S24",
          landingType: "N/A",
          landingLocation: "Gulf of Mexico",
          outcome: "failure",
          note: "Never separated — destroyed with booster by AFTS",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "33 Raptor engines" },
        {
          time: "T+0:27",
          event: "Engine failures begin",
          detail: "Multiple Raptors shut down during ascent",
        },
        {
          time: "T+4:00",
          event: "AFTS triggered",
          detail: "Vehicle tumbling, destroyed over Gulf of Mexico",
        },
      ],
      notes: [
        "First integrated Starship test flight",
        "No flame diverter or water deluge — pad severely damaged",
        "Concrete chunks thrown thousands of feet; nearby van destroyed",
        "SpaceX built steel plate and water deluge system before Flight 2",
      ],
      significance: "First Starship/Super Heavy integrated flight test",
    },
  },

  {
    id: "starship-flight2",
    name: "Starship Flight 2",
    dateUtc: "2023-11-18T13:03:00.000Z",
    dateUnix: 1700312580,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "First successful hot staging. Booster exploded during boostback. Ship destroyed by AFTS at T+8 min due to propellant fire.",
    webcastUrl: "https://www.youtube.com/watch?v=C3iHAgwIYtI",
    flightHistory: {
      flightNumber: 2,
      missionOutcome: "failure",
      missionSummary:
        "Achieved hot staging (first time). Booster exploded during boostback burn. Ship reached ~148 km but AFTS triggered due to propellant venting fire.",
      payloadInfo: "None (test flight)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B9",
          landingType: "N/A",
          landingLocation: "Gulf of Mexico",
          outcome: "failure",
          note: "Exploded during boostback burn after hot staging",
        },
        {
          boosterId: "S25",
          landingType: "N/A",
          landingLocation: "Gulf of Mexico / Caribbean",
          outcome: "failure",
          note: "AFTS triggered at T+8 min due to propellant venting fire; reached ~148 km",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "All 33 engines lit" },
        {
          time: "T+2:30",
          event: "Hot staging",
          detail: "First-ever Starship hot staging — success!",
        },
        {
          time: "T+3:00",
          event: "Booster explosion",
          detail: "Exploded during boostback burn",
        },
        {
          time: "T+8:00",
          event: "Ship AFTS",
          detail: "Propellant venting fire, destroyed at ~148 km",
        },
      ],
      notes: [
        "Huge improvement over Flight 1",
        "Hot staging worked — ship ignited before separation",
        "New water deluge system protected the pad",
        "Reached ~148 km altitude",
      ],
    },
  },

  {
    id: "starship-flight3",
    name: "Starship Flight 3",
    dateUtc: "2024-03-14T13:25:00.000Z",
    dateUnix: 1710422700,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "First Starship to reach space. Payload bay door test and propellant transfer demo achieved. Ship broke apart during reentry.",
    webcastUrl: "https://www.youtube.com/watch?v=ApMrILhTulI",
    flightHistory: {
      flightNumber: 3,
      missionOutcome: "failure",
      missionSummary:
        "Ship reached space — first time. Payload bay door opened/closed, propellant transfer demo completed. Ship broke apart during reentry over Indian Ocean at T+49 min.",
      payloadInfo:
        "None (tested payload bay door; in-space propellant transfer demo for NASA)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B10",
          landingType: "Splashdown (attempted)",
          landingLocation: "Gulf of Mexico",
          outcome: "failure",
          note: "Lost during landing burn over Gulf",
        },
        {
          boosterId: "S28",
          landingType: "N/A",
          landingLocation: "Indian Ocean",
          outcome: "failure",
          note: "Broke apart during reentry at T+49 min; reached space but lost on return",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "Hot staging — success" },
        { time: "T+5:00", event: "Ship reaches space" },
        {
          time: "T+15:00",
          event: "Payload bay door test",
          detail: "Opened and closed successfully",
        },
        {
          time: "T+20:00",
          event: "Propellant transfer demo",
          detail: "NASA Artemis requirement",
        },
        {
          time: "T+49:00",
          event: "Ship breaks apart",
          detail: "During reentry over Indian Ocean",
        },
      ],
      notes: [
        "First Starship to reach space",
        "First payload bay door test",
        "First in-space propellant transfer demo",
      ],
      significance: "First Starship to reach space",
    },
  },

  {
    id: "starship-flight4",
    name: "Starship Flight 4",
    dateUtc: "2024-06-06T12:50:00.000Z",
    dateUnix: 1717674600,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "success",
    rocketType: "Starship",
    details:
      "First fully successful Starship flight. Ship survived reentry for the first time — despite a damaged flap, completed landing flip and ocean splashdown.",
    webcastUrl: "https://www.youtube.com/watch?v=j2BdNDTlWbo",
    flightHistory: {
      flightNumber: 4,
      missionOutcome: "success",
      missionSummary:
        "First Starship to survive reentry. Booster controlled splashdown in Gulf. Ship performed landing flip and splashed down in Indian Ocean (~6 km off target).",
      payloadInfo: "None (test flight)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B11",
          landingType: "Splashdown (planned)",
          landingLocation: "Gulf of Mexico",
          outcome: "success",
          note: "Controlled splashdown — no catch attempt",
        },
        {
          boosterId: "S29",
          landingType: "Splashdown",
          landingLocation: "Indian Ocean",
          outcome: "success",
          note: "First Starship ship to survive reentry! Landing flip and splashdown ~6 km off target",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "Booster splashdown",
          detail: "Controlled Gulf of Mexico splashdown",
        },
        {
          time: "T+40:00",
          event: "Ship reentry",
          detail: "First Starship to survive reentry! Flap visibly melting.",
        },
        {
          time: "T+65:00",
          event: "Ship splashdown",
          detail: "Indian Ocean, ~6 km off target",
        },
      ],
      notes: [
        "First Starship to survive reentry",
        "Live video showed plasma flowing over ship with flap melting",
        "Booster jettisoned hot-stage ring for first time",
      ],
      significance: "First successful Starship flight; first reentry survival",
    },
  },

  {
    id: "starship-flight5",
    name: "Starship Flight 5",
    dateUtc: "2024-10-13T12:25:00.000Z",
    dateUnix: 1728822300,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "success",
    rocketType: "Starship",
    details:
      "Historic first booster catch by Mechazilla tower arms! Ship successfully reentered and splashed down in Indian Ocean.",
    webcastUrl: "https://www.youtube.com/watch?v=hI9HQfCAw64",
    flightHistory: {
      flightNumber: 5,
      missionOutcome: "success",
      missionSummary:
        "Booster caught by launch tower arms (Mechazilla) — historic first. Ship reentered successfully and splashed down in Indian Ocean.",
      payloadInfo: "None (test flight)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B12",
          landingType: "Tower catch",
          landingLocation: "Starbase OLP-1",
          outcome: "success",
          note:
            "FIRST-EVER booster catch by Mechazilla chopsticks! 233-foot booster hovering into mechanical arms.",
        },
        {
          boosterId: "S30",
          landingType: "Splashdown",
          landingLocation: "Indian Ocean",
          outcome: "success",
          note: "Controlled splashdown — successful reentry and landing flip",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "BOOSTER CAUGHT",
          detail:
            "First-ever catch by Mechazilla tower arms — one of the most dramatic moments in spaceflight history",
        },
        {
          time: "T+65:00",
          event: "Ship splashdown",
          detail: "Indian Ocean — controlled",
        },
      ],
      notes: [
        "First-ever booster catch — 233-foot booster hovering into mechanical arms",
        "One of the most dramatic moments in spaceflight history",
        "Last Block 1 booster flight",
        "Occurred the day before FH Europa Clipper launch",
      ],
      significance: "First-ever booster tower catch (Mechazilla)",
    },
  },

  {
    id: "starship-flight6",
    name: "Starship Flight 6",
    dateUtc: "2024-11-19T22:00:00.000Z",
    dateUnix: 1732057200,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "success",
    rocketType: "Starship",
    details:
      "First in-space Raptor engine relight. Tower catch aborted — booster splashed down in Gulf. Ship survived reentry.",
    webcastUrl: "https://www.youtube.com/watch?v=CMGiNKcVSek",
    flightHistory: {
      flightNumber: 6,
      missionOutcome: "success",
      missionSummary:
        "Tower catch aborted — booster controlled splashdown in Gulf. First in-space Raptor relight. Ship survived reentry and splashed down.",
      payloadInfo:
        "Stuffed banana zero-g indicator (Starship's first \"payload\")",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B13",
          landingType: "Splashdown (catch aborted)",
          landingLocation: "Gulf of Mexico",
          outcome: "success",
          note: "Tower catch aborted due to conditions not being met",
        },
        {
          boosterId: "S31",
          landingType: "Splashdown",
          landingLocation: "Indian Ocean",
          outcome: "success",
          note: "Survived reentry and splashed down successfully",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "Catch aborted",
          detail: "Booster controlled splashdown in Gulf",
        },
        {
          time: "T+30:00",
          event: "In-space engine relight",
          detail: "First-ever Raptor relight in vacuum — critical milestone",
        },
        {
          time: "T+65:00",
          event: "Ship splashdown",
          detail: "Indian Ocean — successful reentry",
        },
      ],
      notes: [
        "Last Block 1 vehicle",
        "First in-space Raptor engine relight",
        "The banana became a meme",
      ],
      significance: "First in-space Raptor engine relight",
    },
  },

  {
    id: "starship-flight7",
    name: "Starship Flight 7",
    dateUtc: "2025-01-16T23:37:00.000Z",
    dateUnix: 1737070620,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "First Block 2 flight. Second tower catch! Ship deployed 10 Starlink sims but destroyed by propulsion leak/fire at T+8.5 min.",
    webcastUrl: "https://www.youtube.com/watch?v=Pn6e1O5bEyA",
    flightHistory: {
      flightNumber: 7,
      missionOutcome: "partial",
      missionSummary:
        "Booster caught by tower (2nd catch). Ship deployed 10 Starlink simulators but propulsion leak caused fire — ship broke apart at T+8.5 min over Caribbean.",
      payloadInfo:
        "10 Starlink simulator satellites (intentionally destructible — not operational)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B14",
          landingType: "Tower catch",
          landingLocation: "Starbase OLP-1",
          outcome: "success",
          note:
            "2nd successful tower catch (despite one engine lost during ascent)",
        },
        {
          boosterId: "S33",
          landingType: "N/A",
          landingLocation: "Turks & Caicos / Caribbean",
          outcome: "failure",
          note: "Propulsion leak caused fire at T+8.5 min — debris scattered over Caribbean",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "First Block 2 flight" },
        {
          time: "T+2:30",
          event: "Hot staging",
          detail: "One engine lost during ascent — handled by engine-out",
        },
        {
          time: "T+7:00",
          event: "Booster caught",
          detail: "2nd tower catch",
        },
        {
          time: "T+6:00",
          event: "Starlink sim deployment",
          detail: "10 simulators deployed successfully",
        },
        {
          time: "T+8:30",
          event: "Ship destroyed",
          detail:
            "Propulsion leak and fire — debris over Turks & Caicos",
        },
      ],
      notes: [
        "First Block 2 flight",
        "First Starlink simulator deployment",
        "Vibration-induced hardware stress caused the leak",
        "FAA required mishap investigation",
      ],
    },
  },

  {
    id: "starship-flight8",
    name: "Starship Flight 8",
    dateUtc: "2025-03-06T21:37:00.000Z",
    dateUnix: 1741297020,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "Third tower catch (despite 2 engines failing during boostback). Ship destroyed at T+9:30 — Raptor engine part failure.",
    webcastUrl: "",
    flightHistory: {
      flightNumber: 8,
      missionOutcome: "partial",
      missionSummary:
        "Booster caught (3rd catch) despite 2 boostback engines failing. Ship lost at T+9:30 due to Raptor engine part failure causing fire.",
      payloadInfo: "4 Starlink simulator satellites (not deployed — ship lost)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B15",
          landingType: "Tower catch",
          landingLocation: "Starbase OLP-1",
          outcome: "success",
          note:
            "3rd tower catch — 2 of 13 boostback engines failed to ignite, longer burn compensated",
        },
        {
          boosterId: "S34",
          landingType: "N/A",
          landingLocation: "Bahamas / Florida coast",
          outcome: "failure",
          note: "Raptor part failure caused propellant mix and fire at T+9:30 — debris scattered",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+5:00",
          event: "Booster caught",
          detail: "3rd catch despite 2 engine failures during boostback",
        },
        {
          time: "T+9:30",
          event: "Ship destroyed",
          detail:
            "Raptor part failure caused propellant mix/fire. Debris over Bahamas, Florida.",
        },
      ],
      notes: [
        "Second consecutive Block 2 ship failure",
        "Different root cause from Flight 7 (torque specs vs vibration)",
        "FAA required another mishap investigation",
        "Air traffic disrupted",
      ],
    },
  },

  {
    id: "starship-flight9",
    name: "Starship Flight 9",
    dateUtc: "2025-05-27T18:09:00.000Z",
    dateUnix: 1748365740,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "failure",
    rocketType: "Starship",
    details:
      "First Super Heavy booster reuse (B14 from Flight 7). Ship reached orbit — first Block 2 ship to do so — but methane leak caused loss of control.",
    webcastUrl: "",
    flightHistory: {
      flightNumber: 9,
      missionOutcome: "partial",
      missionSummary:
        "First booster reuse (B14). Ship reached orbit (first Block 2 SECO). Booster destroyed during experimental landing burn. Ship lost control due to methane leak — uncontrolled reentry.",
      payloadInfo:
        "8 Starlink simulators (not deployed due to ship attitude control loss)",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B14-2",
          flightNumber: 2,
          landingType: "Expendable (experimental)",
          landingLocation: "Gulf of Mexico",
          outcome: "failure",
          note:
            "First booster reuse! Destroyed during experimental descent — deliberate 17-degree AoA test. Fuel transfer tube ruptured.",
        },
        {
          boosterId: "S35",
          landingType: "N/A",
          landingLocation: "Indian Ocean",
          outcome: "failure",
          note: "Methane leak caused loss of attitude control — uncontrolled reentry",
        },
      ],
      keyEvents: [
        {
          time: "T+0:00",
          event: "Liftoff",
          detail: "First booster reuse — 29 of 33 Raptors flight-proven",
        },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "Booster destroyed",
          detail:
            "Experimental descent profile — fuel tube ruptured from aero forces",
        },
        {
          time: "T+8:30",
          event: "Ship reaches orbit",
          detail: "First Block 2 SECO — major milestone",
        },
        {
          time: "T+20:00",
          event: "Methane leak",
          detail: "Loss of attitude control, ship spinning",
        },
        {
          time: "T+90:00",
          event: "Uncontrolled reentry",
          detail: "Indian Ocean designated hazard area",
        },
      ],
      notes: [
        "First Super Heavy booster reuse",
        "First Block 2 ship to reach orbit",
        "Ship 36 (originally for Flight 10) destroyed during static fire test",
      ],
      significance: "First booster reuse; first Block 2 ship to reach orbit",
    },
  },

  {
    id: "starship-flight10",
    name: "Starship Flight 10",
    dateUtc: "2025-08-26T16:00:00.000Z",
    dateUnix: 1756281600,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "success",
    rocketType: "Starship",
    details:
      "Broke the Block 2 curse. First successful payload deployment! Ship reentered with intentionally missing tiles, splashed down ~3m from target.",
    webcastUrl: "https://www.youtube.com/watch?v=rcd_SQZDlnk",
    flightHistory: {
      flightNumber: 10,
      missionOutcome: "success",
      missionSummary:
        "Ship deployed 8 Starlink sims, performed relight, survived reentry (with tiles intentionally removed), precision splashdown ~3m from target. Booster hovered then splashed down.",
      payloadInfo:
        "8 Starlink simulator satellites — first successful Starship payload deployment",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B16",
          landingType: "Splashdown (hover test)",
          landingLocation: "Gulf of Mexico",
          outcome: "success",
          note:
            "Hovered over Gulf then intentionally dropped — testing landing procedures",
        },
        {
          boosterId: "S37",
          landingType: "Splashdown",
          landingLocation: "Indian Ocean",
          outcome: "success",
          note: "Precision splashdown ~3m from target! First Block 2 ship to survive reentry",
        },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "1 engine out during ascent, handled" },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "Booster hover test",
          detail: "Hovered over Gulf then dropped — intentional",
        },
        {
          time: "T+6:00",
          event: "Payload deployment",
          detail: "8 Starlink sims deployed — first successful deployment!",
        },
        { time: "T+30:00", event: "Single-engine relight" },
        {
          time: "T+55:00",
          event: "Reentry",
          detail: "Tiles intentionally removed held up well",
        },
        {
          time: "T+65:00",
          event: "Precision splashdown",
          detail: "Indian Ocean, ~3 meters from target!",
        },
      ],
      notes: [
        "First successful Starship payload deployment",
        "First Block 2 ship to survive reentry",
        "Heat shield tiles intentionally removed for stress testing",
        "Huge confidence boost after 3 consecutive ship failures",
      ],
      significance:
        "First successful Starship payload deployment and Block 2 reentry",
    },
  },

  {
    id: "starship-flight11",
    name: "Starship Flight 11",
    dateUtc: "2025-10-13T15:00:00.000Z",
    dateUnix: 1760436000,
    launchSite: {
      id: "boca-chica",
      name: "Starbase",
      fullName: "SpaceX Starbase, Boca Chica",
      lat: 25.9972,
      lng: -97.1561,
    },
    status: "success",
    rocketType: "Starship",
    details:
      "Final Block 2 flight. Second booster reuse (B15). Ship deployed 8 sims, performed banking maneuver during reentry, precision splashdown.",
    webcastUrl: "",
    flightHistory: {
      flightNumber: 11,
      missionOutcome: "success",
      missionSummary:
        "Second booster reuse (B15 from Flight 8). Ship deployed 8 Starlink sims, performed engine relight, dynamic banking maneuver during descent, precision splashdown in Indian Ocean.",
      payloadInfo: "8 Starlink simulator satellites — deployed successfully",
      customer: "SpaceX",
      boosterRecovery: [
        {
          boosterId: "B15-2",
          flightNumber: 2,
          landingType: "Splashdown (planned)",
          landingLocation: "Off Texas coast",
          outcome: "success",
          note:
            "Testing new 5-engine landing burn for Block 3 — no catch attempt",
        },
        {
          boosterId: "S38",
          landingType: "Splashdown",
          landingLocation: "Indian Ocean",
          outcome: "success",
          note: "Precision splashdown — banking maneuver mimicking future Starbase return",
        },
      ],
      keyEvents: [
        {
          time: "T+0:00",
          event: "Liftoff",
          detail: "Final Block 2 flight",
        },
        { time: "T+2:30", event: "Hot staging" },
        {
          time: "T+7:00",
          event: "Booster splashdown",
          detail:
            "Off Texas coast — testing 5-engine config for Block 3",
        },
        {
          time: "T+6:00",
          event: "Payload deployment",
          detail: "8 Starlink sims deployed",
        },
        { time: "T+30:00", event: "Engine relight" },
        {
          time: "T+55:00",
          event: "Banking maneuver",
          detail:
            "Dynamic banking during descent — mimicking future Starbase return profile",
        },
        {
          time: "T+65:00",
          event: "Precision splashdown",
          detail: "Indian Ocean — all objectives achieved",
        },
      ],
      notes: [
        "Final Block 2 flight — transitioning to Block 3 with Raptor 3 engines",
        "Second booster reuse (B15 previously caught on Flight 8)",
        "Banking maneuver simulated future Starbase return trajectory",
        "All major objectives achieved",
      ],
      significance: "Final Block 2 flight; all objectives achieved",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // NOTABLE FALCON 9 MILESTONES (~15 flights)
  // ═══════════════════════════════════════════════════════════════

  {
    id: "f9-orbcomm2",
    name: "ORBCOMM-2",
    dateUtc: "2015-12-22T01:29:00.000Z",
    dateUnix: 1450748940,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO",
    details:
      "First successful Falcon 9 first-stage landing — RTLS at LZ-1. Delivered 11 ORBCOMM OG2 satellites.",
    webcastUrl: "https://www.youtube.com/watch?v=O5bTbVbe4e4",
    flightHistory: {
      flightNumber: 21,
      missionOutcome: "success",
      missionSummary:
        "11 ORBCOMM OG2 satellites deployed. First-ever Falcon 9 first-stage landing at LZ-1.",
      payloadInfo: "11 ORBCOMM OG2 communications satellites",
      customer: "ORBCOMM",
      boosterRecovery: [
        {
          boosterId: "B1019",
          landingType: "RTLS",
          landingLocation: "LZ-1, Cape Canaveral",
          outcome: "success",
          note: "FIRST-EVER successful Falcon 9 landing",
        },
      ],
      notes: [
        "First successful orbital-class rocket landing",
        "Changed the economics of spaceflight forever",
      ],
      significance: "First successful Falcon 9 first-stage landing (RTLS)",
    },
  },

  {
    id: "f9-crs8",
    name: "CRS-8",
    dateUtc: "2016-04-08T20:43:00.000Z",
    dateUnix: 1460148180,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO",
    details:
      "First successful drone ship (ASDS) landing at sea. Delivered BEAM inflatable module to ISS.",
    webcastUrl: "https://www.youtube.com/watch?v=7pUAydjne5M",
    flightHistory: {
      flightNumber: 23,
      missionOutcome: "success",
      missionSummary:
        "Dragon cargo spacecraft delivered to ISS with BEAM module. First-ever drone ship landing.",
      payloadInfo:
        "Dragon cargo with BEAM (Bigelow Expandable Activity Module) for ISS",
      customer: "NASA (CRS)",
      boosterRecovery: [
        {
          boosterId: "B1021",
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
          note: "FIRST-EVER drone ship (ASDS) landing",
        },
      ],
      significance: "First successful ASDS (drone ship) landing",
    },
  },

  {
    id: "f9-ses10",
    name: "SES-10",
    dateUtc: "2017-03-30T22:27:00.000Z",
    dateUnix: 1490912820,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "GTO",
    details:
      "First reuse of an orbital-class rocket booster (B1021). SES-10 satellite delivered to GTO.",
    webcastUrl: "https://www.youtube.com/watch?v=xsZSXav4wI8",
    flightHistory: {
      flightNumber: 32,
      missionOutcome: "success",
      missionSummary:
        "SES-10 delivered to GTO using the first-ever reflown Falcon 9 booster.",
      payloadInfo: "SES-10 communications satellite",
      customer: "SES",
      boosterRecovery: [
        {
          boosterId: "B1021",
          flightNumber: 2,
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
          note: "FIRST-EVER booster reuse — same booster that did CRS-8",
        },
      ],
      notes: [
        "First reuse of an orbital-class rocket booster",
        "B1021 previously flew CRS-8 (first ASDS landing)",
        "Proved orbital-class reusability was real",
      ],
      significance: "First orbital-class booster reuse",
    },
  },

  {
    id: "f9-crewdemo2",
    name: "Crew Demo-2",
    dateUtc: "2020-05-30T19:22:00.000Z",
    dateUnix: 1590866520,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (ISS)",
    details:
      "First crewed orbital launch from American soil since STS-135 in 2011. Doug Hurley and Bob Behnken to ISS.",
    webcastUrl: "https://www.youtube.com/watch?v=xY96v0OIcK4",
    flightHistory: {
      flightNumber: 86,
      missionOutcome: "success",
      missionSummary:
        "First crewed Dragon flight. Doug Hurley and Bob Behnken launched to ISS — first crewed American orbital launch since 2011.",
      payloadInfo:
        "Crew Dragon Endeavour with astronauts Doug Hurley and Bob Behnken",
      customer: "NASA (Commercial Crew)",
      boosterRecovery: [
        {
          boosterId: "B1058",
          flightNumber: 1,
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First crewed orbital launch from US soil since STS-135 (2011)",
        "Ended 9-year dependence on Russian Soyuz",
        "First crewed Dragon flight",
        "Astronauts returned safely August 2, 2020",
      ],
      significance: "First crewed Dragon flight; returned US crewed spaceflight",
    },
  },

  {
    id: "f9-crew1",
    name: "Crew-1",
    dateUtc: "2020-11-16T00:27:00.000Z",
    dateUnix: 1605486420,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (ISS)",
    details:
      "First operational Commercial Crew rotation mission to ISS. Four astronauts for 167-day mission.",
    webcastUrl: "https://www.youtube.com/watch?v=bnChQbxLkkI",
    flightHistory: {
      flightNumber: 101,
      missionOutcome: "success",
      missionSummary:
        "First operational crew rotation to ISS. 4 astronauts (Hopkins, Glover, Walker, Noguchi) for 167-day mission.",
      payloadInfo:
        "Crew Dragon Resilience with 4 astronauts (Hopkins, Glover, Walker, Noguchi)",
      customer: "NASA (Commercial Crew)",
      boosterRecovery: [
        {
          boosterId: "B1061",
          flightNumber: 1,
          landingType: "ASDS",
          landingLocation: "JRTI (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First operational crew rotation mission",
        "Victor Glover: first Black astronaut on long-duration ISS mission",
      ],
      significance: "First operational Commercial Crew rotation",
    },
  },

  {
    id: "f9-transporter1",
    name: "Transporter-1",
    dateUtc: "2021-01-24T15:00:00.000Z",
    dateUnix: 1611500400,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "SSO",
    details:
      "Record 143 satellites on a single launch — most ever deployed on one mission at the time.",
    webcastUrl: "https://www.youtube.com/watch?v=ScHI1cbkUv4",
    flightHistory: {
      flightNumber: 105,
      missionOutcome: "success",
      missionSummary:
        "Record 143 satellites deployed on a single launch — most ever on one mission.",
      payloadInfo:
        "143 satellites including 10 Starlinks and 133 commercial/government smallsats",
      payloadMassKg: 5000,
      customer: "Multiple (rideshare)",
      boosterRecovery: [
        {
          boosterId: "B1058",
          flightNumber: 5,
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "Record 143 satellites on a single launch",
        "First dedicated SmallSat Rideshare Program mission",
      ],
      significance: "Record 143 satellites deployed on one mission",
    },
  },

  {
    id: "f9-inspiration4",
    name: "Inspiration4",
    dateUtc: "2021-09-16T00:02:00.000Z",
    dateUnix: 1631750520,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (575 km)",
    details:
      "First all-civilian orbital spaceflight. 4 non-professional astronauts spent 3 days in orbit at 575 km (higher than ISS).",
    webcastUrl: "https://www.youtube.com/watch?v=3pv01sSq44w",
    flightHistory: {
      flightNumber: 128,
      missionOutcome: "success",
      missionSummary:
        "First all-civilian orbital spaceflight. 4 crew members orbited for 3 days at 575 km — higher than ISS or Hubble.",
      payloadInfo:
        "Crew Dragon Resilience with all-civilian crew (Isaacman, Arceneaux, Proctor, Sembroski)",
      customer: "Jared Isaacman / St. Jude",
      boosterRecovery: [
        {
          boosterId: "B1062",
          flightNumber: 3,
          landingType: "ASDS",
          landingLocation: "JRTI (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First all-civilian orbital spaceflight",
        "575 km orbit — higher than ISS or Hubble",
        "Raised $200M+ for St. Jude Children's Research Hospital",
        "Featured in Netflix documentary",
      ],
      significance: "First all-civilian orbital spaceflight",
    },
  },

  {
    id: "f9-dart",
    name: "DART",
    dateUtc: "2021-11-24T06:21:00.000Z",
    dateUnix: 1637735460,
    launchSite: {
      id: "vandenberg-slc4e",
      name: "VSFB SLC-4E",
      fullName: "Vandenberg Space Force Base SLC-4E",
      lat: 34.632,
      lng: -120.611,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "Interplanetary",
    details:
      "NASA planetary defense mission. Spacecraft impacted asteroid Dimorphos in Sep 2022, successfully altering its orbit.",
    webcastUrl: "https://www.youtube.com/watch?v=XKRf6-NcMqI",
    flightHistory: {
      flightNumber: 132,
      missionOutcome: "success",
      missionSummary:
        "DART spacecraft launched toward asteroid Dimorphos. Successfully impacted in Sep 2022, altering the asteroid's orbit — proving planetary defense concept.",
      payloadInfo:
        "DART (Double Asteroid Redirection Test) — NASA planetary defense spacecraft",
      customer: "NASA",
      boosterRecovery: [
        {
          boosterId: "B1063",
          flightNumber: 3,
          landingType: "ASDS",
          landingLocation: "OCISLY (Pacific)",
          outcome: "success",
        },
      ],
      notes: [
        "First planetary defense test mission",
        "Successfully changed Dimorphos's orbital period by 33 minutes",
        "Proved humanity can deflect asteroids",
      ],
      significance: "First planetary defense asteroid deflection test",
    },
  },

  {
    id: "f9-ax1",
    name: "Ax-1",
    dateUtc: "2022-04-08T15:17:00.000Z",
    dateUnix: 1649430420,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (ISS)",
    details:
      "First fully private crewed mission to ISS. Axiom Space mission with 4 private astronauts. 17-day mission.",
    webcastUrl: "https://www.youtube.com/watch?v=5nLk_Vqp7nw",
    flightHistory: {
      flightNumber: 150,
      missionOutcome: "success",
      missionSummary:
        "First fully private crewed mission to ISS. 4 private astronauts spent 17 days aboard.",
      payloadInfo:
        "Crew Dragon Endeavour with Axiom crew (Lopez-Alegria, Connor, Pathy, Stibbe)",
      customer: "Axiom Space",
      boosterRecovery: [
        {
          boosterId: "B1062",
          flightNumber: 5,
          landingType: "ASDS",
          landingLocation: "ASOG (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First fully private crewed mission to ISS",
        "Commanded by Michael Lopez-Alegria (former NASA astronaut)",
        "Originally 10-day mission extended to 17 due to weather",
      ],
      significance: "First fully private ISS mission",
    },
  },

  {
    id: "f9-polaris-dawn",
    name: "Polaris Dawn",
    dateUtc: "2024-09-10T09:23:00.000Z",
    dateUnix: 1725960180,
    launchSite: {
      id: "ksc-lc39a",
      name: "KSC LC-39A",
      fullName: "Kennedy Space Center Launch Complex 39A",
      lat: 28.6082,
      lng: -80.604,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (1,400 km apogee)",
    details:
      "First commercial EVA (spacewalk). Reached 1,400 km — highest crewed orbit since Apollo. Tested SpaceX EVA suits.",
    webcastUrl: "https://www.youtube.com/watch?v=rQEqKZ7CJlk",
    flightHistory: {
      flightNumber: 371,
      missionOutcome: "success",
      missionSummary:
        "First commercial spacewalk. Reached 1,400 km apogee — highest crewed orbit since Apollo 17 (1972). Tested SpaceX EVA suits and Starlink laser comms.",
      payloadInfo:
        "Crew Dragon with 4 crew (Isaacman, Gillis, Menon, Poteet) — EVA test",
      customer: "Jared Isaacman / Polaris Program",
      boosterRecovery: [
        {
          boosterId: "B1083",
          flightNumber: 2,
          landingType: "ASDS",
          landingLocation: "JRTI (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First commercial spacewalk (EVA)",
        "Highest crewed orbit since Apollo 17 (1972) at 1,400 km",
        "Tested SpaceX-designed EVA suits",
        "First Starlink laser communications from crewed spacecraft",
      ],
      significance: "First commercial spacewalk; highest crewed orbit since Apollo",
    },
  },

  {
    id: "f9-starlink-v1-0",
    name: "Starlink v1.0 L1",
    dateUtc: "2019-11-11T14:56:00.000Z",
    dateUnix: 1573484160,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO",
    details:
      "First operational Starlink launch — 60 v1.0 satellites. Beginning of SpaceX's satellite internet constellation.",
    webcastUrl: "https://www.youtube.com/watch?v=pIDuv0Ta0XQ",
    flightHistory: {
      flightNumber: 75,
      missionOutcome: "success",
      missionSummary:
        "First operational Starlink launch. 60 v1.0 satellites deployed, beginning the satellite internet constellation.",
      payloadInfo: "60 Starlink v1.0 satellites",
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        {
          boosterId: "B1048",
          flightNumber: 4,
          landingType: "ASDS",
          landingLocation: "OCISLY (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "First operational Starlink launch (v1.0)",
        "Beginning of SpaceX's satellite internet constellation",
        "Fourth flight for B1048",
      ],
      significance: "First operational Starlink launch",
    },
  },

  {
    id: "f9-nrol87",
    name: "NROL-87",
    dateUtc: "2022-02-02T20:27:00.000Z",
    dateUnix: 1643835420,
    launchSite: {
      id: "vandenberg-slc4e",
      name: "VSFB SLC-4E",
      fullName: "Vandenberg Space Force Base SLC-4E",
      lat: 34.632,
      lng: -120.611,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (classified)",
    details:
      "First SpaceX launch for NRO (National Reconnaissance Office). Classified payload delivered to orbit.",
    webcastUrl: "https://www.youtube.com/watch?v=L05H6bgycKo",
    flightHistory: {
      flightNumber: 142,
      missionOutcome: "success",
      missionSummary:
        "Classified NRO payload delivered. First SpaceX launch for the National Reconnaissance Office.",
      payloadInfo: "Classified NRO payload",
      customer: "NRO (National Reconnaissance Office)",
      boosterRecovery: [
        {
          boosterId: "B1071",
          flightNumber: 2,
          landingType: "RTLS",
          landingLocation: "LZ-4, Vandenberg",
          outcome: "success",
        },
      ],
      notes: [
        "First SpaceX launch for NRO",
        "Vandenberg RTLS landing at LZ-4",
      ],
      significance: "First SpaceX NRO mission",
    },
  },

  {
    id: "f9-b1058-record",
    name: "Starlink Group 4-27",
    dateUtc: "2022-09-24T22:32:00.000Z",
    dateUnix: 1664059920,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO",
    details:
      "B1058's 14th flight — setting the record for most flights by a single Falcon 9 booster at the time.",
    webcastUrl: "https://www.youtube.com/watch?v=EGiCx--lxMA",
    flightHistory: {
      flightNumber: 179,
      missionOutcome: "success",
      missionSummary:
        "52 Starlink satellites deployed. B1058 became the most-flown Falcon 9 booster (14th flight).",
      payloadInfo: "52 Starlink satellites",
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        {
          boosterId: "B1058",
          flightNumber: 14,
          landingType: "ASDS",
          landingLocation: "ASOG (Atlantic)",
          outcome: "success",
          note: "14th flight — most-flown booster record at the time",
        },
      ],
      notes: [
        "B1058 set record for most flights by a single booster (14)",
        "Same booster that launched Crew Demo-2 and Transporter-1",
      ],
      significance: "Most-flown Falcon 9 booster record (14 flights)",
    },
  },

  {
    id: "f9-bandwagon1",
    name: "Bandwagon-1",
    dateUtc: "2024-04-07T18:16:00.000Z",
    dateUnix: 1712513760,
    launchSite: {
      id: "vandenberg-slc4e",
      name: "VSFB SLC-4E",
      fullName: "Vandenberg Space Force Base SLC-4E",
      lat: 34.632,
      lng: -120.611,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "MEO",
    details:
      "First Bandwagon rideshare mission — SpaceX's new mid-inclination rideshare program for government and commercial smallsats.",
    webcastUrl: "https://www.youtube.com/watch?v=zMhVGhklxBQ",
    flightHistory: {
      flightNumber: 323,
      missionOutcome: "success",
      missionSummary:
        "Inaugurated SpaceX Bandwagon rideshare program. Multiple government and commercial smallsats deployed.",
      payloadInfo: "Multiple government and commercial smallsats",
      customer: "Multiple (rideshare)",
      boosterRecovery: [
        {
          boosterId: "B1071",
          flightNumber: 16,
          landingType: "RTLS",
          landingLocation: "LZ-4, Vandenberg",
          outcome: "success",
        },
      ],
      notes: [
        "First Bandwagon rideshare mission — mid-inclination orbit",
        "Complementing polar Transporter missions",
      ],
      significance: "First Bandwagon rideshare mission",
    },
  },

  {
    id: "f9-crew9",
    name: "Crew-9",
    dateUtc: "2024-09-28T17:17:00.000Z",
    dateUnix: 1727539020,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral Space Force Station SLC-40",
      lat: 28.5618,
      lng: -80.577,
    },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "LEO (ISS)",
    details:
      "Launched with only 2 crew (Hague, Gorbunov) — 2 empty seats reserved for Starliner crew (Wilmore, Williams) to return home.",
    webcastUrl: "https://www.youtube.com/watch?v=CmH0TN6WkSA",
    flightHistory: {
      flightNumber: 375,
      missionOutcome: "success",
      missionSummary:
        "Launched with 2 crew to ISS. 2 seats left empty for Starliner crew (Wilmore & Williams) who needed a ride home after Boeing Starliner issues.",
      payloadInfo:
        "Crew Dragon with Nick Hague and Aleksandr Gorbunov (2 seats reserved for Starliner crew return)",
      customer: "NASA (Commercial Crew)",
      boosterRecovery: [
        {
          boosterId: "B1085",
          flightNumber: 2,
          landingType: "ASDS",
          landingLocation: "ASOG (Atlantic)",
          outcome: "success",
        },
      ],
      notes: [
        "Only 2 crew launched — 2 empty seats for Starliner crew return",
        "Boeing Starliner was unable to safely return its crew",
        "First launch from SLC-40 for a crewed mission",
      ],
      significance: "Rescued Boeing Starliner crew with empty Dragon seats",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // EARLY FALCON FAILURES & MILESTONES
  // ═══════════════════════════════════════════════════════════════

  {
    id: "f1-flight1",
    name: "Falcon 1 Flight 1",
    dateUtc: "2006-03-24T22:30:00.000Z",
    dateUnix: 1143243000,
    launchSite: {
      id: "kwajalein",
      name: "Omelek Island",
      fullName: "Reagan Test Site, Kwajalein Atoll",
      lat: 9.0477,
      lng: 167.7431,
    },
    status: "failure",
    rocketType: "Falcon 1",
    details: "First-ever SpaceX launch. Engine fire at T+33 seconds caused by corroded fuel line nut.",
    webcastUrl: "https://www.youtube.com/watch?v=0a_00nJ_Y88",
    flightHistory: {
      flightNumber: 1,
      missionOutcome: "failure",
      missionSummary: "Engine fire at T+33s. Corroded aluminum nut on a fuel line allowed a fuel leak that ignited. Vehicle fell back onto launch pad.",
      payloadInfo: "FalconSAT-2 (US Air Force Academy 20 kg satellite)",
      customer: "DARPA / US Air Force Academy",
      boosterRecovery: [
        { boosterId: "Merlin 1A", landingType: "N/A", landingLocation: "Launch pad", outcome: "failure", note: "Crashed back onto launch pad — destroyed" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "First-ever SpaceX launch" },
        { time: "T+0:25", event: "Engine fire begins", detail: "Fuel leak from corroded nut" },
        { time: "T+0:33", event: "Loss of thrust", detail: "Vehicle falls back to pad" },
      ],
      notes: [
        "First-ever SpaceX launch attempt",
        "Elon Musk had invested $100M of his own money",
        "Corroded aluminum nut from sea air caused the leak",
        "SpaceX had only 3 more Falcon 1 rockets available",
      ],
      significance: "First SpaceX launch (failure)",
    },
  },

  {
    id: "f1-flight2",
    name: "Falcon 1 Flight 2",
    dateUtc: "2007-03-21T01:10:00.000Z",
    dateUnix: 1174439400,
    launchSite: {
      id: "kwajalein",
      name: "Omelek Island",
      fullName: "Reagan Test Site, Kwajalein Atoll",
      lat: 9.0477,
      lng: 167.7431,
    },
    status: "failure",
    rocketType: "Falcon 1",
    details: "Reached 289 km altitude but fuel slosh in second stage caused roll oscillation — failed to reach orbit.",
    webcastUrl: "https://www.youtube.com/watch?v=Lk4zQ2wP-Nc",
    flightHistory: {
      flightNumber: 2,
      missionOutcome: "failure",
      missionSummary: "First stage performed well. Second stage reached 289 km but fuel slosh caused roll oscillation during coast phase — failed to circularize orbit.",
      payloadInfo: "Demo payload (mass simulator)",
      customer: "SpaceX / DARPA",
      boosterRecovery: [
        { boosterId: "Merlin 1A", landingType: "N/A", landingLocation: "Pacific Ocean", outcome: "expended", note: "First stage performed nominally" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "MECO + stage separation", detail: "First stage worked perfectly" },
        { time: "T+5:00", event: "Second stage roll oscillation", detail: "Fuel slosh caused instability" },
        { time: "T+7:30", event: "Loss of vehicle", detail: "Failed to reach orbit — 289 km altitude" },
      ],
      notes: [
        "Major improvement over Flight 1 — first stage worked",
        "Only 2 Falcon 1 rockets remaining",
        "SpaceX nearly ran out of money",
      ],
      significance: "First stage success but orbit not reached",
    },
  },

  {
    id: "f1-flight3",
    name: "Falcon 1 Flight 3",
    dateUtc: "2008-08-03T03:34:00.000Z",
    dateUnix: 1217730840,
    launchSite: {
      id: "kwajalein",
      name: "Omelek Island",
      fullName: "Reagan Test Site, Kwajalein Atoll",
      lat: 9.0477,
      lng: 167.7431,
    },
    status: "failure",
    rocketType: "Falcon 1",
    details: "First stage worked perfectly with new Merlin 1C. Stage separation collision — residual thrust pushed first stage into second stage.",
    webcastUrl: "https://www.youtube.com/watch?v=v0w9p3U8860",
    flightHistory: {
      flightNumber: 3,
      missionOutcome: "failure",
      missionSummary: "New Merlin 1C engine worked perfectly. At stage separation, residual thrust from the first stage caused it to re-contact the second stage, damaging the engine.",
      payloadInfo: "Trailblazer (DoD satellite) + NanoSail-D + PRESat + Celestis cremation capsule",
      customer: "US DoD / NASA",
      boosterRecovery: [
        { boosterId: "Merlin 1C", landingType: "N/A", landingLocation: "Pacific Ocean", outcome: "expended", note: "Stage performed perfectly — new Merlin 1C engine" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "First Merlin 1C engine flight" },
        { time: "T+2:30", event: "MECO", detail: "Flawless first stage performance" },
        { time: "T+2:34", event: "Stage collision", detail: "Residual thrust pushed stages together" },
        { time: "T+2:40", event: "Second stage damaged", detail: "Nozzle damaged — orbit unreachable" },
      ],
      notes: [
        "Heartbreaking failure — everything worked except timing",
        "Only 1 Falcon 1 rocket left — SpaceX near bankruptcy",
        "Elon Musk was running out of personal funds",
        "Carried cremated remains of astronaut Gordon Cooper and actor James Doohan",
      ],
      significance: "Near-success — stage separation timing issue",
    },
  },

  {
    id: "f1-flight4",
    name: "Falcon 1 Flight 4",
    dateUtc: "2008-09-28T23:15:00.000Z",
    dateUnix: 1222643700,
    launchSite: {
      id: "kwajalein",
      name: "Omelek Island",
      fullName: "Reagan Test Site, Kwajalein Atoll",
      lat: 9.0477,
      lng: 167.7431,
    },
    status: "success",
    rocketType: "Falcon 1",
    details: "First privately developed liquid-fueled rocket to reach orbit. SpaceX was weeks away from bankruptcy.",
    webcastUrl: "https://www.youtube.com/watch?v=mq2hymWPN1I",
    flightHistory: {
      flightNumber: 4,
      missionOutcome: "success",
      missionSummary: "First privately developed liquid-fuel rocket to reach Earth orbit. Used longer delay between stage separation and second stage ignition to solve Flight 3's issue.",
      payloadInfo: "165 kg mass simulator (RatSat)",
      customer: "SpaceX",
      boosterRecovery: [
        { boosterId: "Merlin 1C", landingType: "N/A", landingLocation: "Pacific Ocean", outcome: "expended" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "Last chance for SpaceX — final Falcon 1" },
        { time: "T+2:30", event: "MECO + separation", detail: "Longer coast phase to prevent re-contact" },
        { time: "T+2:39", event: "Second stage ignition" },
        { time: "T+9:28", event: "SECO — ORBIT!", detail: "First privately funded liquid-fuel rocket in orbit!" },
      ],
      notes: [
        "SpaceX was weeks from bankruptcy — this saved the company",
        "Elon Musk had split his last $100M between SpaceX and Tesla",
        "NASA awarded SpaceX a $1.6B CRS contract days later",
        "Fourth time's the charm — 3 failures before this success",
      ],
      significance: "First privately developed liquid-fuel rocket to orbit — saved SpaceX",
    },
  },

  {
    id: "f9-crs7",
    name: "CRS-7",
    dateUtc: "2015-06-28T14:21:11.000Z",
    dateUnix: 1435500071,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral SLC-40",
      lat: 28.5618,
      lng: -80.5770,
    },
    status: "failure",
    rocketType: "Falcon 9",
    details: "Dragon cargo resupply to ISS. Vehicle broke apart at T+139s due to a faulty strut holding a helium pressure vessel.",
    webcastUrl: "https://www.youtube.com/watch?v=PuNymhcTtSQ",
    flightHistory: {
      flightNumber: 19,
      missionOutcome: "failure",
      missionSummary: "At T+139 seconds, a steel strut supporting a helium COPV inside the second-stage LOX tank failed under 3,500 PSI load (rated for 10,000). Helium burst into the tank, overpressurizing and destroying the vehicle.",
      payloadInfo: "Dragon CRS-7 cargo (~1,800 kg supplies for ISS + IDA-1 docking adapter)",
      payloadMassKg: 1800,
      customer: "NASA",
      boosterRecovery: [
        { boosterId: "B1018", landingType: "N/A", landingLocation: "Atlantic Ocean", outcome: "failure", note: "Vehicle destroyed at ~45 km altitude — strut failure" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+1:00", event: "Max-Q" },
        { time: "T+2:19", event: "Strut failure", detail: "Steel strut holding helium COPV breaks inside LOX tank" },
        { time: "T+2:19", event: "Vehicle breakup", detail: "Second stage overpressurization — vehicle destroyed at ~45 km" },
      ],
      notes: [
        "First Falcon 9 mission failure",
        "Dragon capsule survived briefly but no parachute deploy command sent",
        "Lost IDA-1 docking adapter needed for Commercial Crew",
        "SpaceX redesigned COPV struts after this failure",
        "Grounded Falcon 9 for 6 months",
      ],
      significance: "First Falcon 9 mission failure — strut design flaw",
    },
  },

  {
    id: "f9-amos6",
    name: "AMOS-6",
    dateUtc: "2016-09-01T13:07:00.000Z",
    dateUnix: 1472738820,
    launchSite: {
      id: "cape-canaveral-slc40",
      name: "CCSFS SLC-40",
      fullName: "Cape Canaveral SLC-40",
      lat: 28.5618,
      lng: -80.5770,
    },
    status: "failure",
    rocketType: "Falcon 9",
    details: "Falcon 9 exploded on the pad during fueling for a routine static fire test. $200M AMOS-6 satellite destroyed.",
    webcastUrl: "https://www.youtube.com/watch?v=_BgJEXQkjNQ",
    flightHistory: {
      missionOutcome: "failure",
      missionSummary: "During propellant loading for a static fire test, a helium COPV buckled inside the second-stage LOX tank, causing rapid unscheduled disassembly (explosion) on the pad.",
      payloadInfo: "AMOS-6 communications satellite ($200M — Spacecom)",
      customer: "Spacecom / Facebook (Internet.org)",
      boosterRecovery: [
        { boosterId: "B1028", landingType: "N/A", landingLocation: "SLC-40 Pad", outcome: "failure", note: "Exploded on pad during fueling — total vehicle and payload loss" },
      ],
      keyEvents: [
        { time: "T-8:00", event: "LOX loading", detail: "Routine propellant loading for static fire" },
        { time: "T-3:00", event: "Anomaly", detail: "COPV buckled in super-chilled LOX environment" },
        { time: "T-3:00", event: "Explosion", detail: "Rapid unscheduled disassembly — pad severely damaged" },
      ],
      notes: [
        "Not a launch failure — exploded during pad fueling for static fire",
        "Destroyed $200M AMOS-6 satellite (owned by Spacecom)",
        "Facebook's Internet.org satellite was part of the payload",
        "SLC-40 launch pad heavily damaged — took 14 months to repair",
        "Led to COPV design changes and helium loading procedure updates",
      ],
      significance: "Pad explosion during fueling — COPV design overhaul",
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // FLIGHT HISTORY FOR 2025-2026 MISSIONS (matches fallback IDs)
  // ═══════════════════════════════════════════════════════════════

  {
    id: "fb-001",
    name: "Starlink Group 12-1",
    dateUtc: "2025-09-15T06:00:00.000Z",
    dateUnix: 1726380000,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Starlink v2 Mini batch deployment to shell 4. Booster B1081 on its 12th flight.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Deployed 23 Starlink v2 Mini satellites to 530 km orbit. B1081 on 12th flight — landed on ASDS 'Just Read the Instructions' in the Atlantic.",
      payloadInfo: "23 Starlink v2 Mini satellites (~18,000 kg total)",
      payloadMassKg: 18000,
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        { boosterId: "B1081", flightNumber: 12, landingType: "ASDS", landingLocation: "JRTI (Atlantic)", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:33", event: "MECO + stage separation" },
        { time: "T+8:30", event: "Booster landing", detail: "12th landing for B1081" },
        { time: "T+15:30", event: "SECO" },
        { time: "T+63:00", event: "Satellite deployment", detail: "23 Starlink v2 Mini released" },
      ],
    },
  },

  {
    id: "fb-002",
    name: "NROL-167",
    dateUtc: "2025-10-03T10:00:00.000Z",
    dateUnix: 1727949600,
    launchSite: { id: "vandenberg-slc4e", name: "VSFB SLC-4E", fullName: "Vandenberg SLC-4E", lat: 34.6321, lng: -120.6108 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Classified NRO mission from Vandenberg. Booster returned to LZ-4.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Classified payload for the National Reconnaissance Office. Booster landed at LZ-4. Payload details classified.",
      payloadInfo: "Classified NRO payload",
      customer: "National Reconnaissance Office (NRO)",
      boosterRecovery: [
        { boosterId: "B1075", flightNumber: 8, landingType: "RTLS", landingLocation: "LZ-4, Vandenberg", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+2:30", event: "MECO" },
        { time: "T+7:30", event: "Booster RTLS landing", detail: "LZ-4 — 8th flight for B1075" },
      ],
      notes: ["Classified NRO mission — orbit and payload undisclosed"],
    },
  },

  {
    id: "fb-004",
    name: "Starlink Group 12-5",
    dateUtc: "2025-11-01T14:00:00.000Z",
    dateUnix: 1730469600,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Starlink v2 Mini deployment. Booster B1078 on 15th flight — new reuse record.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Deployed 23 Starlink v2 Mini satellites. B1078 achieved 15th flight — setting a new booster reuse record at the time.",
      payloadInfo: "23 Starlink v2 Mini satellites",
      payloadMassKg: 18000,
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        { boosterId: "B1078", flightNumber: 15, landingType: "ASDS", landingLocation: "JRTI (Atlantic)", outcome: "success", note: "New booster reuse record at the time — 15th flight" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+8:30", event: "Booster landing", detail: "15th landing — new record" },
        { time: "T+63:00", event: "Satellite deployment" },
      ],
      notes: ["B1078 set a new reuse record with 15 flights"],
      significance: "New booster reuse record — 15th flight",
    },
  },

  {
    id: "fb-005",
    name: "Eutelsat 36X",
    dateUtc: "2025-11-14T22:00:00.000Z",
    dateUnix: 1731621600,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "GTO",
    details: "Eutelsat communications satellite to GTO. Direct-to-home TV services for Africa and Middle East.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Launched Eutelsat 36X communications satellite to geostationary transfer orbit for TV broadcast services across Africa and the Middle East.",
      payloadInfo: "Eutelsat 36X communications satellite (~5,500 kg)",
      payloadMassKg: 5500,
      customer: "Eutelsat",
      boosterRecovery: [
        { boosterId: "B1083", flightNumber: 5, landingType: "ASDS", landingLocation: "ASOG (Atlantic)", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+8:30", event: "Booster landing" },
        { time: "T+32:00", event: "Satellite deployment", detail: "GTO injection — satellite will raise orbit using onboard propulsion" },
      ],
    },
  },

  {
    id: "fb-006",
    name: "Transporter-13",
    dateUtc: "2025-11-28T18:00:00.000Z",
    dateUnix: 1732816800,
    launchSite: { id: "vandenberg-slc4e", name: "VSFB SLC-4E", fullName: "Vandenberg SLC-4E", lat: 34.6321, lng: -120.6108 },
    status: "success",
    rocketType: "Falcon 9",
    details: "SmallSat rideshare mission deploying 60+ satellites for various customers to SSO.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "SmallSat rideshare mission deploying 60+ satellites for dozens of commercial and government customers to sun-synchronous orbit.",
      payloadInfo: "60+ smallsats from various customers (~6,000 kg total)",
      payloadMassKg: 6000,
      customer: "Various (rideshare)",
      boosterRecovery: [
        { boosterId: "B1071", flightNumber: 18, landingType: "RTLS", landingLocation: "LZ-4, Vandenberg", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+7:30", event: "Booster RTLS", detail: "18th flight for B1071" },
        { time: "T+58:00", event: "Deployment sequence begins", detail: "60+ satellites deployed over 30 minutes" },
      ],
    },
  },

  {
    id: "fb-007",
    name: "CRS-32",
    dateUtc: "2025-12-10T12:00:00.000Z",
    dateUnix: 1733832000,
    launchSite: { id: "ksc-lc39a", name: "KSC LC-39A", fullName: "Kennedy Space Center Launch Complex 39A", lat: 28.6082, lng: -80.6041 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Dragon cargo resupply mission to the ISS carrying experiments, crew supplies, and hardware.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Dragon cargo spacecraft delivered ~2,500 kg of supplies, experiments, and hardware to the ISS. Successfully berthed and later splashed down off Florida coast.",
      payloadInfo: "Dragon CRS-32 (~2,500 kg cargo for ISS)",
      payloadMassKg: 2500,
      customer: "NASA",
      boosterRecovery: [
        { boosterId: "B1077", flightNumber: 10, landingType: "ASDS", landingLocation: "ASOG (Atlantic)", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff" },
        { time: "T+8:30", event: "Booster landing" },
        { time: "T+12:00", event: "Dragon separation" },
        { time: "T+24h", event: "ISS approach and berth" },
      ],
    },
  },

  {
    id: "fb-008",
    name: "Starlink Group 13-1",
    dateUtc: "2025-12-22T04:00:00.000Z",
    dateUnix: 1734836400,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Starlink v2 Mini batch. B1080 on 13th flight.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Deployed 23 Starlink v2 Mini satellites. B1080 on its 13th flight landed successfully on JRTI.",
      payloadInfo: "23 Starlink v2 Mini satellites",
      payloadMassKg: 18000,
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        { boosterId: "B1080", flightNumber: 13, landingType: "ASDS", landingLocation: "JRTI (Atlantic)", outcome: "success" },
      ],
    },
  },

  {
    id: "fb-010",
    name: "USSF-124",
    dateUtc: "2026-01-20T06:45:00.000Z",
    dateUnix: 1737352800,
    launchSite: { id: "ksc-lc39a", name: "KSC LC-39A", fullName: "Kennedy Space Center Launch Complex 39A", lat: 28.6082, lng: -80.6041 },
    status: "success",
    rocketType: "Falcon Heavy",
    details: "Classified USSF payload launched on Falcon Heavy. All three cores expended.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Classified United States Space Force payload launched to high-energy orbit. All three Falcon Heavy cores expended — no landing attempts due to mission profile requirements.",
      payloadInfo: "Classified USSF-124 payload (likely GEO or HEO)",
      customer: "United States Space Force",
      boosterRecovery: [
        { boosterId: "Center core", landingType: "Expended", landingLocation: "Atlantic Ocean", outcome: "expended", note: "Expended — high-energy mission required all fuel" },
        { boosterId: "Side booster L", landingType: "Expended", landingLocation: "Atlantic Ocean", outcome: "expended" },
        { boosterId: "Side booster R", landingType: "Expended", landingLocation: "Atlantic Ocean", outcome: "expended" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "27 Merlin engines" },
        { time: "T+2:30", event: "Side booster separation" },
        { time: "T+3:30", event: "Center core separation" },
        { time: "T+30:00", event: "Payload deployment", detail: "Classified orbit" },
      ],
      notes: ["All three cores expended — no recovery attempted"],
    },
  },

  {
    id: "fb-011",
    name: "Starlink Group 13-4",
    dateUtc: "2026-02-02T15:30:00.000Z",
    dateUnix: 1738510200,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Starlink v2 Mini deployment. B1082 on its 11th flight.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Deployed 23 Starlink v2 Mini satellites. Booster B1082 completed its 11th successful flight and landing.",
      payloadInfo: "23 Starlink v2 Mini satellites",
      payloadMassKg: 18000,
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        { boosterId: "B1082", flightNumber: 11, landingType: "ASDS", landingLocation: "ASOG (Atlantic)", outcome: "success" },
      ],
    },
  },

  {
    id: "fb-012",
    name: "WorldView Legion-5",
    dateUtc: "2026-02-18T09:00:00.000Z",
    dateUnix: 1739858400,
    launchSite: { id: "vandenberg-slc4e", name: "VSFB SLC-4E", fullName: "Vandenberg SLC-4E", lat: 34.6321, lng: -120.6108 },
    status: "success",
    rocketType: "Falcon 9",
    payloadOrbit: "SSO",
    details: "Maxar WorldView Legion-5 Earth observation satellite to SSO from Vandenberg.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Launched Maxar WorldView Legion-5 high-resolution Earth observation satellite to sun-synchronous orbit. 30 cm resolution imaging capability.",
      payloadInfo: "WorldView Legion-5 Earth observation satellite (~700 kg)",
      payloadMassKg: 700,
      customer: "Maxar Technologies",
      boosterRecovery: [
        { boosterId: "B1076", flightNumber: 9, landingType: "RTLS", landingLocation: "LZ-4, Vandenberg", outcome: "success" },
      ],
    },
  },

  {
    id: "fb-012b",
    name: "Starlink 10-40",
    dateUtc: "2026-03-04T10:52:00.000Z",
    dateUnix: 1741085520,
    launchSite: { id: "cape-canaveral-slc40", name: "CCSFS SLC-40", fullName: "Cape Canaveral SLC-40", lat: 28.5618, lng: -80.5770 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Starlink v2 Mini batch. Twilight launch — potential jellyfish plume visible from Florida coast.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Deployed 23 Starlink v2 Mini satellites. Launched during twilight creating a spectacular jellyfish-shaped exhaust plume visible across Florida.",
      payloadInfo: "23 Starlink v2 Mini satellites",
      payloadMassKg: 18000,
      customer: "SpaceX (Starlink)",
      boosterRecovery: [
        { boosterId: "B1079", flightNumber: 16, landingType: "ASDS", landingLocation: "ASOG (Atlantic)", outcome: "success" },
      ],
      notes: ["Twilight launch created spectacular jellyfish-effect plume visible from the ground"],
    },
  },

  {
    id: "fb-013",
    name: "Crew-12",
    dateUtc: "2026-03-01T10:00:00.000Z",
    dateUnix: 1740826800,
    launchSite: { id: "ksc-lc39a", name: "KSC LC-39A", fullName: "Kennedy Space Center Launch Complex 39A", lat: 28.6082, lng: -80.6041 },
    status: "success",
    rocketType: "Falcon 9",
    details: "Crew Dragon mission carrying 4 astronauts to ISS for Expedition 75/76.",
    flightHistory: {
      missionOutcome: "success",
      missionSummary: "Crew Dragon 'Endeavour' carried 4 astronauts to ISS for ~6 month Expedition 75/76 stay. Successful docking ~24 hours after launch.",
      payloadInfo: "4 astronauts (2 NASA + 1 JAXA + 1 ESA) aboard Crew Dragon 'Endeavour'",
      customer: "NASA (Commercial Crew Program)",
      boosterRecovery: [
        { boosterId: "B1084", flightNumber: 4, landingType: "ASDS", landingLocation: "ASOG (Atlantic)", outcome: "success" },
      ],
      keyEvents: [
        { time: "T+0:00", event: "Liftoff", detail: "4 crew aboard Crew Dragon Endeavour" },
        { time: "T+2:33", event: "Stage separation" },
        { time: "T+8:30", event: "Booster landing" },
        { time: "T+12:00", event: "Dragon in orbit" },
        { time: "T+24h", event: "ISS docking", detail: "Harmony module forward port" },
      ],
      notes: ["12th operational Crew Dragon mission for NASA"],
      significance: "12th operational Commercial Crew mission",
    },
  },
];
