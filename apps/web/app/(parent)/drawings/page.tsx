import { DrawingGallery } from '@/components/parent/DrawingGallery';

export default function DrawingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <h2 className="text-3xl font-black text-white">Saved Drawings</h2>
      <DrawingGallery />
    </div>
  );
}
