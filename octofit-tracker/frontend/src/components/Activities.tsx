import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const state = useApiResource<ActivityResponse>('/api/activities');
  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {state.status === 'loading' && <p role="status">Loading activities...</p>}
      {state.status === 'error' && <p role="alert">Unable to load activities: {state.message}</p>}
      {state.status === 'success' && state.data.activities.length === 0 && <p>No activities yet.</p>}
      {state.status === 'success' && state.data.activities.length > 0 && (
        <ul className="list-group">
          {state.data.activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
              {activity.type}: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
