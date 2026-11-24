import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const state = useApiResource<TeamResponse>('/api/teams');
  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {state.status === 'loading' && <p role="status">Loading teams...</p>}
      {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
      {state.status === 'success' && state.data.teams.length === 0 && <p>No teams yet.</p>}
      {state.status === 'success' && state.data.teams.length > 0 && (
        <ul className="list-group">
          {state.data.teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
              {team.name} ({team.mascot}) - {team.members.length} members
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
