"use client";

import { useState, useRef } from "react";
import { useBdp } from "../bdp-context";
import AvatarCircle from "../components/AvatarCircle";
import { Compass } from "lucide-react";

export default function BdpProfilePage() {
  const { user, refetchUser } = useBdp();
  const [viewMode, setViewMode] = useState(user?.viewMode || "mobile");
  const [uiPreset, setUiPreset] = useState(user?.uiPreset || "whatsapp_spiegel");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/arag-bdp/auth/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewMode, uiPreset }),
      });
      refetchUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/arag-bdp/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        await fetch("/api/arag-bdp/auth/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: data.avatarUrl }),
        });
        refetchUser();
      }
    } catch {}
    setUploading(false);
  };

  const handleTourRestart = () => {
    try {
      const key = `arag_bdp_tourSeen_${user.environment}_${user.code}`;
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent("bdp-tour-restart"));
    } catch {}
  };

  const displayAvatar = previewUrl || user.photoUrl;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="text-profile-title">Profil</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div data-testid="text-profile-avatar">
            <AvatarCircle avatarUrl={displayAvatar} code={user.code} size="lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-profile-code">{user.code}</h2>
            <p className="text-gray-500 text-sm">{user.role}</p>
            {user.isAdmin && <span className="text-xs bg-[#FFD700] px-2 py-0.5 rounded-full font-bold">Admin</span>}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">User-Code</span>
            <span className="font-medium font-mono" data-testid="text-profile-usercode">{user.code}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Workspace</span>
            <span className="font-medium" data-testid="text-profile-workspace">arag</span>
          </div>
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
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#FFD700] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {displayAvatar ? (
            <div className="flex flex-col items-center gap-3">
              <AvatarCircle avatarUrl={displayAvatar} code={user.code} size="lg" />
              <p className="text-gray-400 text-sm">{uploading ? "Wird hochgeladen..." : "Klicken zum Ändern"}</p>
            </div>
          ) : (
            <>
              <span className="text-3xl mb-2 block">📷</span>
              <p className="text-gray-400 text-sm">{uploading ? "Wird hochgeladen..." : "Foto hochladen (optional)"}</p>
            </>
          )}
          <input
            ref={fileRef}
            data-testid="input-photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Ansicht</h2>
        <div className="space-y-4">
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
                  {mode === "mobile" ? "Mobil" : mode === "tablet" ? "Tablet" : "Desktop"}
                </button>
              ))}
            </div>
          </div>

          <button
            data-testid="button-save-settings"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#E6C200] transition-colors disabled:opacity-50 mt-2"
          >
            {saving ? "Speichern..." : saved ? "Gespeichert" : "Einstellungen speichern"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Hilfe</h2>
        <button
          data-testid="bdp-tour-restart"
          onClick={handleTourRestart}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#FFFBF0] border border-[#FFD700]/30 hover:border-[#FFD700] transition-colors text-sm font-medium"
        >
          <Compass size={18} className="text-[#FFD700]" />
          Tour erneut starten
        </button>
      </div>
    </div>
  );
}
