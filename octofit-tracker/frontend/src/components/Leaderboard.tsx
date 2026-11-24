import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const state = useApiResource<LeaderboardResponse>('/api/leaderboard');
  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
      {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
      {state.status === 'success' && state.data.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
      {state.status === 'success' && state.data.leaderboard.length > 0 && (
        <ol className="list-group list-group-numbered">
          {state.data.leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.rank}>
              {entry.teamName}: {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
