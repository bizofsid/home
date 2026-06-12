import { v4 as uuidv4 } from "uuid";
import {
  Asset,
  CueDimension,
  HouseholdState,
  ScheduleItem,
  StaffCue,
  StaffMember,
} from "@/app/types";

const STORAGE_KEY = "itinerant_household";

function seedState(): HouseholdState {
  const assets: Asset[] = [
    { id: "a-penthouse", name: "Fifth Avenue Penthouse", type: "residence", location: "Manhattan, NY", status: "Staffed & ready" },
    { id: "a-estate", name: "Further Lane Estate", type: "residence", location: "East Hampton, NY", status: "Winterized" },
    { id: "a-jet", name: "Gulfstream G700", type: "jet", location: "Teterboro (TEB)", status: "Crew on standby" },
    { id: "a-yacht", name: "M/Y Serenity (62m)", type: "yacht", location: "Port de Monaco", status: "Provisioned" },
    { id: "a-jetski-1", name: "Jetski — VX Cruiser ×2", type: "watercraft", location: "Aboard Serenity", status: "Fueled", parentId: "a-yacht" },
    { id: "a-tender", name: "Tender — Williams 565", type: "watercraft", location: "Aboard Serenity", status: "Ready", parentId: "a-yacht" },
    { id: "a-heli", name: "Airbus H145", type: "aircraft", location: "Helipad, Serenity", status: "Pilot on call", parentId: "a-yacht" },
    { id: "a-maybach", name: "Maybach S680", type: "vehicle", location: "Penthouse garage", status: "Detailed", parentId: "a-penthouse" },
    { id: "a-rangerover", name: "Range Rover SV", type: "vehicle", location: "Estate garage", status: "Ready", parentId: "a-estate" },
    { id: "a-office", name: "Family Office", type: "office", location: "432 Park Ave, NY", status: "Open" },
  ];

  const staff: StaffMember[] = [
    { id: "s-ea", name: "Victoria", role: "Chief of Staff", tags: ["NYC", "global", "ops"], phone: "+12125550101", instagram: "victoria.cos" },
    { id: "s-chef", name: "Laurent", role: "Executive Chef", tags: ["NYC", "Hamptons", "cuisine"], phone: "+12125550102", instagram: "chef.laurent" },
    { id: "s-driver", name: "Marcus", role: "Chauffeur", tags: ["NYC", "driving"], phone: "+12125550103" },
    { id: "s-security", name: "Dmitri", role: "Head of Security", tags: ["global", "security"], phone: "+12125550104" },
    { id: "s-estate", name: "Eleanor", role: "Estate Manager", tags: ["Hamptons", "household"], phone: "+16315550105", instagram: "eleanor.estates" },
    { id: "s-captain", name: "Capt. Rhys", role: "Yacht Captain", tags: ["Monaco", "Mediterranean", "maritime"], phone: "+33612550106" },
    { id: "s-pilot", name: "Capt. Okafor", role: "Chief Pilot", tags: ["global", "aviation"], phone: "+12015550107" },
  ];

  const schedule: ScheduleItem[] = [
    { id: uuidv4(), time: "07:00", title: "Morning briefing with Chief of Staff", assetId: "a-penthouse", staffIds: ["s-ea"] },
    { id: uuidv4(), time: "09:30", title: "Portfolio review", assetId: "a-office", staffIds: [] },
    { id: uuidv4(), time: "19:30", title: "Dinner", assetId: "a-penthouse", staffIds: ["s-chef"] },
  ];

  const cues: StaffCue[] = [
    { id: uuidv4(), staffId: "s-driver", instruction: "Maybach at the door for 09:00 departure to the office", dimension: "time", time: "09:00", status: "acknowledged", createdAt: Date.now() },
    { id: uuidv4(), staffId: "s-chef", instruction: "Dinner for two at 19:30 — omakase, source from Masa's supplier", dimension: "matter", time: "19:30", status: "pending", createdAt: Date.now() },
  ];

  return { assets, staff, schedule, cues };
}

export function getHousehold(): HouseholdState {
  if (typeof window === "undefined") return seedState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as HouseholdState;
  } catch {
    return seedState();
  }
}

function save(state: HouseholdState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetHousehold(): HouseholdState {
  const seeded = seedState();
  save(seeded);
  return seeded;
}

function findByName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const q = name.toLowerCase();
  return (
    items.find((i) => i.name.toLowerCase() === q) ??
    items.find((i) => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase()))
  );
}

function findStaff(state: HouseholdState, name: string): StaffMember | undefined {
  const q = name.toLowerCase();
  return (
    findByName(state.staff, name) ??
    state.staff.find((s) => s.role.toLowerCase().includes(q))
  );
}

const DIMENSIONS: CueDimension[] = ["time", "space", "money", "matter", "value"];

/** Executes a tool call from the AI against household state. Returns a result string for the model. */
export function executeTool(name: string, input: Record<string, unknown>): string {
  const state = getHousehold();

  switch (name) {
    case "add_schedule_item": {
      const assetName = (input.asset_name as string) || "";
      const asset = assetName ? findByName(state.assets, assetName) : undefined;
      const staffNames = (input.staff_names as string[]) || [];
      const staffIds = staffNames
        .map((n) => findStaff(state, n)?.id)
        .filter((id): id is string => Boolean(id));
      const item: ScheduleItem = {
        id: uuidv4(),
        time: (input.time as string) || "09:00",
        title: (input.title as string) || "Untitled",
        assetId: asset?.id,
        staffIds,
        notes: (input.notes as string) || undefined,
      };
      state.schedule.push(item);
      state.schedule.sort((a, b) => a.time.localeCompare(b.time));
      save(state);
      return `Added to itinerary: ${item.time} — ${item.title}${asset ? ` @ ${asset.name}` : ""}`;
    }

    case "remove_schedule_item": {
      const q = ((input.title as string) || "").toLowerCase();
      const idx = state.schedule.findIndex((s) => s.title.toLowerCase().includes(q));
      if (idx === -1) return `No itinerary item matching "${input.title}"`;
      const [removed] = state.schedule.splice(idx, 1);
      save(state);
      return `Removed from itinerary: ${removed.time} — ${removed.title}`;
    }

    case "send_staff_cue": {
      const staffMember = findStaff(state, (input.staff_name as string) || "");
      if (!staffMember) return `No staff member matching "${input.staff_name}". Available: ${state.staff.map((s) => `${s.name} (${s.role})`).join(", ")}`;
      const dim = DIMENSIONS.includes(input.dimension as CueDimension)
        ? (input.dimension as CueDimension)
        : "time";
      const cue: StaffCue = {
        id: uuidv4(),
        staffId: staffMember.id,
        instruction: (input.instruction as string) || "",
        dimension: dim,
        time: (input.time as string) || undefined,
        status: "pending",
        createdAt: Date.now(),
      };
      state.cues.unshift(cue);
      save(state);
      return `Cue dispatched to ${staffMember.name} (${staffMember.role}) [${dim}]: ${cue.instruction}`;
    }

    case "update_asset_status": {
      const asset = findByName(state.assets, (input.asset_name as string) || "");
      if (!asset) return `No asset matching "${input.asset_name}"`;
      asset.status = (input.status as string) || asset.status;
      if (typeof input.location === "string" && input.location) asset.location = input.location;
      save(state);
      return `${asset.name}: status → ${asset.status}${input.location ? `, location → ${asset.location}` : ""}`;
    }

    case "add_asset": {
      const parent = input.parent_asset_name
        ? findByName(state.assets, input.parent_asset_name as string)
        : undefined;
      const asset: Asset = {
        id: uuidv4(),
        name: (input.name as string) || "Unnamed asset",
        type: (input.type as Asset["type"]) || "equipment",
        location: (input.location as string) || (parent ? `With ${parent.name}` : "Unknown"),
        status: (input.status as string) || "Logged",
        parentId: parent?.id,
      };
      state.assets.push(asset);
      save(state);
      return `Asset logged: ${asset.name} [${asset.type}] @ ${asset.location}${parent ? ` (on ${parent.name})` : ""}`;
    }

    case "add_staff": {
      const member: StaffMember = {
        id: uuidv4(),
        name: (input.name as string) || "Unnamed",
        role: (input.role as string) || "Staff",
        tags: Array.isArray(input.tags) ? (input.tags as string[]) : [],
        phone: (input.phone as string) || undefined,
        instagram: (input.instagram as string) || undefined,
      };
      state.staff.push(member);
      save(state);
      return `Staff added: ${member.name} (${member.role}) tags: ${member.tags.join(", ") || "none"}`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

export function addAssetManual(asset: Omit<Asset, "id">): HouseholdState {
  const state = getHousehold();
  state.assets.push({ ...asset, id: uuidv4() });
  save(state);
  return state;
}

export function updateAssetStatusManual(assetId: string, status: string): HouseholdState {
  const state = getHousehold();
  const asset = state.assets.find((a) => a.id === assetId);
  if (asset) asset.status = status;
  save(state);
  return state;
}

export function removeAssetById(assetId: string): HouseholdState {
  const state = getHousehold();
  state.assets = state.assets.filter((a) => a.id !== assetId && a.parentId !== assetId);
  save(state);
  return state;
}

export function setCueStatus(cueId: string, status: StaffCue["status"]): HouseholdState {
  const state = getHousehold();
  const cue = state.cues.find((c) => c.id === cueId);
  if (cue) cue.status = status;
  save(state);
  return state;
}

export function removeScheduleItemById(id: string): HouseholdState {
  const state = getHousehold();
  state.schedule = state.schedule.filter((s) => s.id !== id);
  save(state);
  return state;
}

/** Compact serialization of state for the model's context. */
export function describeHousehold(): string {
  const state = getHousehold();
  const assetLine = (a: Asset): string => {
    const children = state.assets.filter((c) => c.parentId === a.id);
    const base = `${a.name} [${a.type}] @ ${a.location} — ${a.status}`;
    return children.length
      ? `${base}\n${children.map((c) => `    ↳ ${c.name} [${c.type}] — ${c.status}`).join("\n")}`
      : base;
  };
  const roots = state.assets.filter((a) => !a.parentId);
  const staffById = Object.fromEntries(state.staff.map((s) => [s.id, s]));
  const assetById = Object.fromEntries(state.assets.map((a) => [a.id, a]));

  return [
    "ASSETS (↳ = berthed/garaged on parent asset):",
    ...roots.map((a) => "  " + assetLine(a)),
    "",
    "STAFF (allocate with geography in mind — match tags to the itinerary's locations):",
    ...state.staff.map(
      (s) =>
        `  ${s.name} — ${s.role} | tags: ${s.tags.join(", ") || "none"}${s.phone ? " | SMS ✓" : ""}${s.instagram ? " | IG ✓" : ""}`
    ),
    "",
    "TODAY'S ITINERARY:",
    ...(state.schedule.length
      ? state.schedule.map(
          (i) =>
            `  ${i.time} — ${i.title}${i.assetId ? ` @ ${assetById[i.assetId]?.name}` : ""}${
              i.staffIds.length ? ` (staff: ${i.staffIds.map((id) => staffById[id]?.name).join(", ")})` : ""
            }`
        )
      : ["  (empty)"]),
    "",
    "ACTIVE STAFF CUES:",
    ...(state.cues.length
      ? state.cues.map(
          (c) =>
            `  [${c.dimension}] ${staffById[c.staffId]?.name}: ${c.instruction}${c.time ? ` (${c.time})` : ""} — ${c.status}`
        )
      : ["  (none)"]),
  ].join("\n");
}
