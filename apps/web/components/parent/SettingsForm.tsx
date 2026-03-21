"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@kiddokeys/ui';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const SettingsForm = () => {
  const { settings, updateSettings } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await setDoc(doc(db, 'parents', auth.currentUser.uid), {
        settings: settings
      }, { merge: true });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error("Settings sync failed", e);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white/8 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
      <h3 className="text-xl font-black text-white mb-8">Child Session Settings</h3>
      <div className="space-y-8">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <p className="font-bold text-white">Sound Effects</p>
            <p className="text-xs text-slate-500 font-medium">Enable pentatonic musical feedback</p>
          </div>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
            className="w-6 h-6 rounded-lg border-white/10 bg-black/20 accent-sky-500 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
          <div>
            <p className="font-bold text-white">Animations</p>
            <p className="text-xs text-slate-500 font-medium">Enable letter bursts and particle effects</p>
          </div>
          <input
            type="checkbox"
            checked={settings.animationsEnabled}
            onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
            className="w-6 h-6 rounded-lg border-white/10 bg-black/20 accent-sky-500 cursor-pointer"
          />
        </div>

        <div className="space-y-4">
          <p className="font-bold text-white ml-1">Visual Theme</p>
          <div className="flex flex-wrap gap-3">
            {(['colorful', 'space', 'ocean', 'jungle'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t })}
                className={cn(
                  "px-5 py-2.5 rounded-xl border text-sm capitalize font-bold transition-all",
                  settings.theme === t
                    ? "bg-gradient-to-r from-sky-500 to-emerald-500 border-transparent text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                    : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex items-center gap-4">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full md:w-auto bg-gradient-to-r from-sky-500 to-emerald-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : null}
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
          </Button>
          
          {saveStatus === 'error' && (
            <p className="text-rose-500 text-xs font-bold animate-bounce">Failed to sync. Try again!</p>
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
