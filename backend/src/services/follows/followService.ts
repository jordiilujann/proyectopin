import Follow from "../../models/follow.js";
import User from "../../models/user.js";

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("No puedes seguirte a ti mismo");
  }

  try {
    // upsert para evitar duplicados si ya existe
    const follow = await Follow.findOneAndUpdate(
      { follower_id: followerId, following_id: followingId },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return follow;
  } catch (err: any) {
    throw new Error(`Error al seguir al usuario: ${err.message ?? err}`);
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const deleted = await Follow.findOneAndDelete({
      follower_id: followerId,
      following_id: followingId,
    });

    return deleted;
  } catch (err: any) {
    throw new Error(`Error al dejar de seguir al usuario: ${err.message ?? err}`);
  }
}

// Lista de usuarios que SIGUEN a userId
export async function getFollowers(userId: string) {
  const follows = await Follow.find({ following_id: userId }).lean();
  const followerIds = follows.map(f => f.follower_id);

  if (!followerIds.length) return [];

  const users = await User.find({ _id: { $in: followerIds } }).lean();
  return users;
}

// Lista de usuarios a los que userId SIGUE
export async function getFollowing(userId: string) {
  const follows = await Follow.find({ follower_id: userId }).lean();
  const followingIds = follows.map(f => f.following_id);

  if (!followingIds.length) return [];

  const users = await User.find({ _id: { $in: followingIds } }).lean();
  return users;
}

export async function getFollowerCount(userId: string) {
  return Follow.countDocuments({ following_id: userId });
}

export async function getFollowingCount(userId: string) {
  return Follow.countDocuments({ follower_id: userId });
}
