import { SettingsForm } from '@/components/parent/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black text-white">App Settings</h2>
      <SettingsForm />
    </div>
  );
}
