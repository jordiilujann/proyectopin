import mongoose from "mongoose";

function getEnvVariable(envVariableName: string): string {
  const envVariableValue = process.env[envVariableName];
  if (!envVariableValue) throw new Error(`Missing env: ${envVariableName}`);
  return envVariableValue;
}

export async function connectToDatabase() {
  try {
    const mongoDbUri = getEnvVariable("MONGODB_URI");
    await mongoose.connect(mongoDbUri);
    console.log("✅ Conectado a MongoDB");
  } catch (connectionError) {
    console.error("❌ Error conectando a MongoDB:", connectionError);
    throw connectionError;
  }
}
