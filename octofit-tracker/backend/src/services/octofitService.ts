import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;

  if (typeof userId !== 'string' || !mongoose.isObjectIdOrHexString(userId)) {
    throw httpError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !mongoose.isObjectIdOrHexString(teamId)) {
    throw httpError(400, 'A valid teamId is required');
  }
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user) throw httpError(400, 'The requested user does not exist');
  if (!team) throw httpError(400, 'The requested team does not exist');

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
  if (!isRecord(input)) throw httpError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;

  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'A team mascot is required');
  if (!Array.isArray(members) || !members.every((member) => typeof member === 'string' && mongoose.isObjectIdOrHexString(member))) {
    throw httpError(400, 'Members must be valid user IDs');
  }

  const memberIds = [...new Set(members)];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) throw httpError(400, 'Every member must be an existing user');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: string; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

const activityFocus: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  walk: 'mobility',
  strength: 'strength',
};

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('_id fitnessGoal').lean();
  if (!user) throw httpError(404, 'No user was found for that email address');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean();
  const recentFocus = recentActivity
    ? activityFocus[recentActivity.type.toLowerCase()] ?? recentActivity.type.toLowerCase()
    : undefined;
  const focusOptions = [...new Set([recentFocus, user.fitnessGoal].filter((focus): focus is string => Boolean(focus)))];

  for (const focus of focusOptions) {
    const workouts = await Workout.find({ focus }).sort({ title: 1 }).lean();
    if (workouts.length > 0) {
      const reason = recentFocus === focus
        ? `Recommended based on your recent ${recentActivity?.type} activity.`
        : `Recommended to support your ${user.fitnessGoal} fitness goal.`;
      return workouts.map((workout) => ({ ...workout, reason }));
    }
  }

  return [];
}

export { User };
