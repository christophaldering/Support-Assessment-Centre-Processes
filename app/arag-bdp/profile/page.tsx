"use client";

import { useState } from "react";
import { useBdp } from "../layout";

export default function BdpProfilePage() {
  const { user, refetchUser } = useBdp();
  const [viewMode, setViewMode] = useState(user?.viewMode || "mobile");
  const [uiPreset, setUiPreset] = useState(user?.uiPreset || "whatsapp_spiegel");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/arag-bdp/auth/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewMode, uiPreset }),
      });
      refetchUser();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-profile-title">Profil</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-[#FFD700] rounded-2xl flex items-center justify-center text-3xl font-bold text-black" data-testid="text-profile-avatar">
            {user.photoUrl ? <img src={user.photoUrl} className="w-20 h-20 rounded-2xl object-cover" alt="" /> : user.code[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-profile-code">{user.code}</h2>
            <p className="text-gray-500 text-sm">{user.role}</p>
            {user.isAdmin && <span className="text-xs bg-[#FFD700] px-2 py-0.5 rounded-full font-bold">Admin</span>}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Umgebung</span>
            <span className="font-medium">{user.environment}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Rolle</span>
            <span className="font-medium">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Foto hochladen</h2>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <span className="text-3xl mb-2 block">📷</span>
          <p className="text-gray-400 text-sm">Foto-Upload (optional)</p>
          <input
            data-testid="input-photo-upload"
            type="file"
            accept="image/*"
            className="mt-3 text-sm"
            onChange={() => {}}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Ansicht</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">Anzeige-Modus</label>
            <div className="grid grid-cols-3 gap-2">
              {(["mobile", "tablet", "desktop"] as const).map(mode => (
                <button
                  key={mode}
                  data-testid={`button-viewmode-${mode}`}
                  onClick={() => setViewMode(mode)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${viewMode === mode ? "bg-[#FFD700] text-black" : "bg-gray-100 text-gray-600"}`}
                >
                  {mode === "mobile" ? "📱 Mobil" : mode === "tablet" ? "📲 Tablet" : "🖥️ Desktop"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">UI-Vorlage</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "whatsapp_spiegel", label: "Modern (WhatsApp/Spiegel)" },
                { key: "classic", label: "Klassisch" },
              ].map(preset => (
                <button
                  key={preset.key}
                  data-testid={`button-preset-${preset.key}`}
                  onClick={() => setUiPreset(preset.key)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${uiPreset === preset.key ? "bg-[#FFD700] text-black" : "bg-gray-100 text-gray-600"}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
