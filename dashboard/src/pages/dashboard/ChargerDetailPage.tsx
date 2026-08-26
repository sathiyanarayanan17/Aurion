import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useFleet } from '../../context/FleetContext';
import { ChargerDetail } from '../../components/detail/ChargerDetail';
import { ArrowLeft } from 'lucide-react';

export function ChargerDetailPage() {
  const { chargerId } = useParams<{ chargerId: string }>();
  const { selectCharger } = useFleet();
  const navigate = useNavigate();

  useEffect(() => {
    if (chargerId) {
      selectCharger(chargerId);
    }
  }, [chargerId, selectCharger]);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <ChargerDetail />
    </div>
  );
}
