import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function getUserById(id) {
  await connectToDatabase();
  const user = await User.findById(id).select('name email phone role createdAt _id').lean();
  if (!user) return null;
  const { _id, ...rest } = user;
  return { ...rest, id: _id.toString() };
}

export async function getUserByEmailOrPhone(identifier) {
  await connectToDatabase();
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).lean();
  if (!user) return null;
  const { _id, ...rest } = user;
  return { ...rest, id: _id.toString() };
}

export async function createUser(data) {
  await connectToDatabase();
  return User.create(data);
}
