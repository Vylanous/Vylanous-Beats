// Minimal admin customization UI
import { useEffect, useState } from "react";
import { getAdminSettings, saveAdminSettings } from "../lib/admin";
import { FileUpload } from "../components/admin/file-upload";

const fonts = ["Inter, system-ui, sans-serif", "Montserrat, sans-serif", "Poppins, sans-serif"];

export default function CustomizationPanel() {
  const [settings, setSettings] = useState<any>({ theme: { primary: "#a24df5", background: "#0a0a0c", text: "#edeef2" }, brand: {}, font: { family: fonts[0] } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminSettings().then((r) => { setSettings(r.settings || settings); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const setThemeValue = (k: string, v: string) => setSettings((s: any) => ({ ...s, theme: { ...(s.theme || {}), [k]: v } }));

  return (
    <div>
      <h2 className="font-display text-xl">Customization</h2>
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-xs uppercase text-vb-silver/60">Primary color</label>
          <input type="color" value={settings.theme.primary} onChange={(e) => setThemeValue("primary", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase text-vb-silver/60">Background color</label>
          <input type="color" value={settings.theme.background} onChange={(e) => setThemeValue("background", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs uppercase text-vb-silver/60">Font</label>
          <select value={settings.font.family} onChange={(e) => setSettings((s:any)=>({...s,font:{family:e.target.value}}))}>
            {fonts.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase text-vb-silver/60">Logo</label>
          <FileUpload label="Logo" accept="image/*" folder="brand" value={settings.brand.logoKey || ""} previewUrl={settings.brand.logoUrl} onChange={(k)=>setSettings((s:any)=>({...s,brand:{...s.brand,logoKey:k}}))} />
        </div>

        <div>
          <label className="block text-xs uppercase text-vb-silver/60">Favicon</label>
          <FileUpload label="Favicon" accept="image/x-icon,image/png" folder="brand" value={settings.brand.faviconKey || ""} previewUrl={settings.brand.faviconUrl} onChange={(k)=>setSettings((s:any)=>({...s,brand:{...s.brand,faviconKey:k}}))} />
        </div>

        <div className="pt-4">
          <button className="btn" onClick={async()=>{ setSaving(true); await saveAdminSettings(JSON.stringify(settings)); setSaving(false); }}>Save</button>
        </div>
      </div>
    </div>
  );
}
