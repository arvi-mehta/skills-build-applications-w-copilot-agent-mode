import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };
const loadTeams = (path: string) => getJson<TeamsResponse>(path);

export default function Teams() {
  return (
    <CapabilityCard<TeamsResponse>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      load={loadTeams}
      emptyText="No teams yet."
      isEmpty={({ teams }) => teams.length === 0}
      render={({ teams }) => (
        <ul className="list-group list-group-flush" aria-label="Teams">
          {teams.map((team) => (
            <li className="list-group-item d-flex justify-content-between" key={team._id ?? team.name}>
              <span>{team.name} <span className="text-muted">{team.mascot}</span></span>
              <span>{team.members.length} members</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
