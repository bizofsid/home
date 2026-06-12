"use client";

import { useState } from "react";
import {
  Asset,
  AssetType,
  CueDimension,
  HouseholdState,
  StaffCue,
} from "@/app/types";
import {
  addAssetManual,
  removeAssetById,
  removeScheduleItemById,
  setCueStatus,
  updateAssetStatusManual,
} from "@/lib/household";

interface Props {
  state: HouseholdState;
  onChange: (next: HouseholdState) => void;
}

const TYPE_ICON: Record<AssetType, string> = {
  residence: "🏠",
  jet: "🛩️",
  yacht: "🛥️",
  vehicle: "🚗",
  watercraft: "🌊",
  aircraft: "🚁",
  office: "🏢",
  equipment: "🧰",
};

const DIM_STYLE: Record<CueDimension, string> = {
  time: "bg-sky-100 text-sky-700",
  space: "bg-violet-100 text-violet-700",
  money: "bg-emerald-100 text-emerald-700",
  matter: "bg-amber-100 text-amber-700",
  value: "bg-rose-100 text-rose-700",
};

const CUE_STATUS_STYLE: Record<StaffCue["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  acknowledged: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

function smsLink(phone: string, body: string): string {
  return `sms:${phone}?&body=${encodeURIComponent(body)}`;
}

function igLink(handle: string): string {
  return `https://ig.me/m/${handle}`;
}

export default function DayPanel({ state, onChange }: Props) {
  const [addingAsset, setAddingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    type: "residence" as AssetType,
    location: "",
    status: "Needs review",
    parentId: "",
  });

  const staffById = Object.fromEntries(state.staff.map((s) => [s.id, s]));
  const assetById = Object.fromEntries(state.assets.map((a) => [a.id, a]));
  const rootAssets = state.assets.filter((a) => !a.parentId);

  function submitAsset() {
    if (!assetForm.name.trim()) return;
    onChange(
      addAssetManual({
        name: assetForm.name.trim(),
        type: assetForm.type,
        location: assetForm.location.trim() || "Unknown",
        status: assetForm.status.trim() || "Logged",
        parentId: assetForm.parentId || undefined,
      })
    );
    setAssetForm({ name: "", type: "residence", location: "", status: "Needs review", parentId: "" });
    setAddingAsset(false);
  }

  function AssetRow({ asset, depth }: { asset: Asset; depth: number }) {
    const children = state.assets.filter((a) => a.parentId === asset.id);
    return (
      <>
        <div
          className="group flex items-center gap-2 py-1.5 text-sm"
          style={{ paddingLeft: depth * 18 }}
        >
          <span>{TYPE_ICON[asset.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-800">{asset.name}</p>
            <p className="truncate text-xs text-gray-400">{asset.location}</p>
          </div>
          <input
            value={asset.status}
            onChange={(e) =>
              onChange(updateAssetStatusManual(asset.id, e.target.value))
            }
            className="w-28 rounded-md border border-transparent bg-gray-50 px-2 py-0.5 text-right text-xs text-gray-500 focus:border-gray-300 focus:bg-white focus:outline-none"
            title="Asset status — edit inline"
          />
          <button
            onClick={() => onChange(removeAssetById(asset.id))}
            className="text-gray-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
            title="Remove asset (and nested assets)"
          >
            ✕
          </button>
        </div>
        {children.map((c) => (
          <AssetRow key={c.id} asset={c} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-l border-gray-200 bg-gray-50 xl:w-96">
      {/* Itinerary */}
      <section className="border-b border-gray-200 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Today&apos;s Itinerary
        </h3>
        {state.schedule.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing scheduled. Tell your EA what the day looks like.</p>
        ) : (
          <div className="space-y-2">
            {state.schedule.map((item) => (
              <div key={item.id} className="group flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="font-mono text-sm font-semibold text-indigo-600">{item.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {item.assetId && assetById[item.assetId] && (
                      <>
                        {TYPE_ICON[assetById[item.assetId].type]} {assetById[item.assetId].name}
                      </>
                    )}
                    {item.staffIds.length > 0 && (
                      <> · {item.staffIds.map((id) => staffById[id]?.name).filter(Boolean).join(", ")}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onChange(removeScheduleItemById(item.id))}
                  className="text-gray-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Staff cues */}
      <section className="border-b border-gray-200 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Staff Cues
        </h3>
        {state.cues.length === 0 ? (
          <p className="text-sm text-gray-400">No active cues.</p>
        ) : (
          <div className="space-y-2">
            {state.cues.map((cue) => {
              const member = staffById[cue.staffId];
              const body = `${cue.instruction}${cue.time ? ` — ${cue.time}` : ""}`;
              return (
                <div key={cue.id} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${DIM_STYLE[cue.dimension]}`}>
                      {cue.dimension}
                    </span>
                    <span className="text-xs font-medium text-gray-700">
                      {member?.name} · {member?.role}
                    </span>
                    {cue.time && (
                      <span className="ml-auto font-mono text-xs text-gray-400">{cue.time}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{cue.instruction}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {member?.phone && (
                      <a
                        href={smsLink(member.phone, body)}
                        className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                        title={`SMS ${member.phone}`}
                      >
                        💬 SMS
                      </a>
                    )}
                    {member?.instagram && (
                      <a
                        href={igLink(member.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                        title={`DM @${member.instagram}`}
                      >
                        📸 IG
                      </a>
                    )}
                    <select
                      value={cue.status}
                      onChange={(e) =>
                        onChange(setCueStatus(cue.id, e.target.value as StaffCue["status"]))
                      }
                      className={`ml-auto rounded-lg px-2 py-1 text-xs font-medium ${CUE_STATUS_STYLE[cue.status]} cursor-pointer border-0`}
                    >
                      <option value="pending">pending</option>
                      <option value="acknowledged">acknowledged</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Assets */}
      <section className="border-b border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Assets
          </h3>
          <button
            onClick={() => setAddingAsset((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            {addingAsset ? "Cancel" : "+ Log asset"}
          </button>
        </div>

        {addingAsset && (
          <div className="mb-3 space-y-2 rounded-xl bg-white p-3 shadow-sm">
            <input
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              placeholder="Name — e.g. Aspen Chalet"
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <div className="flex gap-2">
              <select
                value={assetForm.type}
                onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as AssetType })}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              >
                {Object.keys(TYPE_ICON).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_ICON[t as AssetType]} {t}
                  </option>
                ))}
              </select>
              <select
                value={assetForm.parentId}
                onChange={(e) => setAssetForm({ ...assetForm, parentId: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                title="Nest on a parent asset"
              >
                <option value="">No parent</option>
                {state.assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    on {a.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={assetForm.location}
              onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
              placeholder="Location"
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <input
              value={assetForm.status}
              onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
              placeholder="Status — e.g. Needs cleaning"
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={submitAsset}
              disabled={!assetForm.name.trim()}
              className="w-full rounded-lg bg-indigo-600 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-gray-300"
            >
              Log asset
            </button>
          </div>
        )}

        <div>
          {rootAssets.map((a) => (
            <AssetRow key={a.id} asset={a} depth={0} />
          ))}
        </div>
      </section>

      {/* Staff */}
      <section className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Staff
        </h3>
        <div className="space-y-2">
          {state.staff.map((s) => (
            <div key={s.id} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">{s.role}</p>
                <span className="ml-auto flex gap-1 text-xs">
                  {s.phone && <span title={s.phone}>💬</span>}
                  {s.instagram && <span title={`@${s.instagram}`}>📸</span>}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
