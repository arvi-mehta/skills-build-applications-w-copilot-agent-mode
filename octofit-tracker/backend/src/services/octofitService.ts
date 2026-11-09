import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  if (
    !isObjectId(userId) ||
    !isObjectId(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members: inputMembers } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
  const members = inputMembers === undefined ? [] : inputMembers;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    !members.every(isObjectId)
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const memberIds = [...new Set(members)];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(String(team._id)) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const normalizeFocus = (focus: string) => focus.trim().toLowerCase();
  const getActivityFocus = (type: string) => {
    const activityType = normalizeFocus(type);
    if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(activityType)) {
      return 'endurance';
    }
    return activityType;
  };
  const availableFocuses = new Set(workouts.map((workout) => normalizeFocus(workout.focus)));
  const goalFocus = normalizeFocus(user.fitnessGoal);
  const goalMatches = availableFocuses.has(goalFocus);
  const matchingActivity = recentActivities.find((activity) => availableFocuses.has(getActivityFocus(activity.type)));
  const preferredFocus = goalMatches
    ? goalFocus
    : matchingActivity
      ? getActivityFocus(matchingActivity.type)
      : undefined;

  return [...workouts]
    .sort((first, second) => {
      const firstMatches = preferredFocus !== undefined && normalizeFocus(first.focus) === preferredFocus;
      const secondMatches = preferredFocus !== undefined && normalizeFocus(second.focus) === preferredFocus;
      return Number(secondMatches) - Number(firstMatches);
    })
    .slice(0, 3)
    .map((workout) => {
      const matchesPreference = preferredFocus !== undefined && normalizeFocus(workout.focus) === preferredFocus;
      const reason = matchesPreference
        ? goalMatches
          ? `Matches your ${user.fitnessGoal} fitness goal.`
          : `Based on your recent ${matchingActivity?.type} activity.`
        : preferredFocus
          ? `An alternative to support your ${preferredFocus} focus.`
          : 'Suggested as a general fitness option.';
      return { ...workout, reason };
    });
}

export { User };
