import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type WorkoutSuggestion = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const state = useApiResource<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);
  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
      {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
      {state.status === 'success' && state.data.suggestions.length === 0 && <p>No workout suggestions available.</p>}
      {state.status === 'success' && state.data.suggestions.length > 0 && (
        <ul className="list-group">
          {state.data.suggestions.map((workout, index) => (
            <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
              <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}
              <p className="mb-0">{workout.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
