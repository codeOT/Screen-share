import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { MongoClient, ObjectId, type Db } from "mongodb";
import { FREE_SHARE_LIMIT } from "../account";

const scryptAsync = promisify(scrypt);
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const RESET_MS = 1000 * 60 * 60;

export const SESSION_COOKIE = "screnn_session";

export type PublicAccount = {
  name: string;
  email: string;
  sharesUsed: number;
};

type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  sharesUsed: number;
  resetTokenHash?: string | null;
  resetExpires?: Date | null;
  createdAt: Date;
};

const globalMongo = globalThis as unknown as { scrennMongo?: Promise<MongoClient> };

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/screnn";
  if (!globalMongo.scrennMongo) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    globalMongo.scrennMongo = client.connect().then(async (connected) => {
      const db = connected.db("screnn");
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true });
      return connected;
    }).catch((err) => {
      globalMongo.scrennMongo = undefined;
      throw err;
    });
  }
  const connected = await globalMongo.scrennMongo;
  return connected.db("screnn");
}

function users(db: Db) {
  return db.collection<UserDoc>("users");
}

function sessions(db: Db) {
  return db.collection<{ tokenHash: string; userId: ObjectId; expiresAt: Date }>("sessions");
}

export function publicAccount(user: Pick<UserDoc, "name" | "email" | "sharesUsed">): PublicAccount {
  return { name: user.name, email: user.email, sharesUsed: user.sharesUsed || 0 };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return { passwordSalt: salt, passwordHash: derived.toString("hex") };
}

export async function passwordMatches(password: string, salt: string, hash: string) {
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export async function createUser(name: string, email: string, password: string) {
  const db = await getDb();
  const secret = await hashPassword(password);
  try {
    const result = await users(db).insertOne({
      _id: new ObjectId(),
      name,
      email,
      passwordHash: secret.passwordHash,
      passwordSalt: secret.passwordSalt,
      sharesUsed: 0,
      resetTokenHash: null,
      resetExpires: null,
      createdAt: new Date(),
    });
    const user = await users(db).findOne({ _id: result.insertedId });
    if (!user) throw new Error("Could not create the account.");
    return user;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) return null;
    throw err;
  }
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return users(db).findOne({ email });
}

export async function openSession(userId: ObjectId) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  await sessions(db).insertOne({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_MS),
  });
  return token;
}

export async function userFromToken(token: string | undefined) {
  if (!token) return null;
  const db = await getDb();
  const session = await sessions(db).findOne({ tokenHash: hashToken(token) });
  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) await sessions(db).deleteOne({ tokenHash: session.tokenHash });
    return null;
  }
  return users(db).findOne({ _id: session.userId });
}

export async function closeSession(token: string | undefined) {
  if (!token) return;
  const db = await getDb();
  await sessions(db).deleteOne({ tokenHash: hashToken(token) });
}

export async function replacePassword(userId: ObjectId, password: string) {
  const db = await getDb();
  const secret = await hashPassword(password);
  await users(db).updateOne(
    { _id: userId },
    { $set: { passwordHash: secret.passwordHash, passwordSalt: secret.passwordSalt, resetTokenHash: null, resetExpires: null } },
  );
  await sessions(db).deleteMany({ userId });
}

export async function saveResetToken(userId: ObjectId) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  await users(db).updateOne(
    { _id: userId },
    { $set: { resetTokenHash: hashToken(token), resetExpires: new Date(Date.now() + RESET_MS) } },
  );
  return token;
}

export async function userFromResetToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await getDb();
  const user = await users(db).findOne({ resetTokenHash: hashToken(token) });
  if (!user?.resetExpires || user.resetExpires.getTime() < Date.now()) return null;
  return user;
}

export async function updateUser(userId: ObjectId, name: string, email: string, password?: string) {
  const db = await getDb();
  const next: Partial<UserDoc> = { name, email };
  if (password) {
    const secret = await hashPassword(password);
    next.passwordHash = secret.passwordHash;
    next.passwordSalt = secret.passwordSalt;
  }
  try {
    await users(db).updateOne({ _id: userId }, { $set: next });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) return null;
    throw err;
  }
  return users(db).findOne({ _id: userId });
}

export async function useShare(userId: ObjectId) {
  const db = await getDb();
  return users(db).findOneAndUpdate(
    { _id: userId, sharesUsed: { $lt: FREE_SHARE_LIMIT } },
    { $inc: { sharesUsed: 1 } },
    { returnDocument: "after" },
  );
}
