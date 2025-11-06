import User from "../../models/user.js";

export async function createUser(userData: any) {
  try {
    const existingUser = await User.findOne({ spotify_id: userData.spotify_id });
    if (existingUser) {
      return existingUser;
    }
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new Error(`Error al crear el usuario: ${error}`);
  }
}

export async function getUsers(filters: any = {}) {
  try {
    const users = await User.find(filters).sort({ created_at: -1 });
    return users;
  } catch (error) {
    throw new Error(`Error al obtener usuarios: ${error}`);
  }
}

export async function getUserById(id: string) {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  } catch (error) {
    throw new Error(`Error al obtener el usuario: ${error}`);
  }
}

export async function getUserBySpotifyId(spotifyId: string) {
  try {
    const user = await User.findOne({ spotify_id: spotifyId });
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  } catch (error) {
    throw new Error(`Error al obtener el usuario por Spotify ID: ${error}`);
  }
}

export async function updateUser(id: string, updateData: any) {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  } catch (error) {
    throw new Error(`Error al actualizar el usuario: ${error}`);
  }
}

export async function deleteUser(id: string) {
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  } catch (error) {
    throw new Error(`Error al eliminar el usuario: ${error}`);
  }
}

