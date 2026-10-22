import { Resolver } from "node:dns/promises";
import {
  MongoClient,
  MongoServerError,
  ObjectId,
  type Collection,
} from "mongodb";

export type UserRole = "user" | "admin";

export interface UserDocument {
  name: string;
  phone: string;
  email: string;
  address: string;
  passwordHash?: string;
  role: UserRole;
  createdAt: Date;
}

export type UserProfile = Pick<
  UserDocument,
  "name" | "phone" | "email" | "address" | "role" | "createdAt"
> & { _id: ObjectId };

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

let emailIndexPromise: Promise<string> | undefined;

async function createMongoClient(
  uri: string,
  dnsServers: string[] | undefined,
): Promise<MongoClient> {
  if (!dnsServers?.length || !uri.startsWith("mongodb+srv://")) {
    return new MongoClient(uri);
  }

  const connectionUrl = new URL(uri.replace(/^mongodb\+srv:/, "https:"));
  const hostname = connectionUrl.hostname.toLowerCase();
  const resolver = new Resolver();
  resolver.setServers(dnsServers);

  const records = await resolver.resolveSrv(`_mongodb._tcp.${hostname}`);
  if (records.length === 0) {
    throw new Error("MongoDB SRV DNS lookup returned no hosts.");
  }

  const parentDomain =
    hostname.split(".").length < 3
      ? hostname
      : hostname.slice(hostname.indexOf(".") + 1);
  const hosts = records.map(({ name, port }) => {
    const target = name.replace(/\.$/, "").toLowerCase();
    if (!target.endsWith(`.${parentDomain}`)) {
      throw new Error("MongoDB SRV DNS lookup returned an unexpected host.");
    }
    return `${target}:${port || 27017}`;
  });

  let txtOptions = new URLSearchParams();
  try {
    const txtRecords = await resolver.resolveTxt(hostname);
    if (txtRecords.length > 1) {
      throw new Error("MongoDB TXT DNS lookup returned multiple records.");
    }
    if (txtRecords.length === 1) {
      txtOptions = new URLSearchParams(txtRecords[0].join(""));
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      (error.code !== "ENODATA" && error.code !== "ENOTFOUND")
    ) {
      throw error;
    }
  }

  for (const key of ["authSource", "replicaSet", "loadBalanced"]) {
    const value = txtOptions.get(key);
    if (value && !connectionUrl.searchParams.has(key)) {
      connectionUrl.searchParams.set(key, value);
    }
  }
  if (
    !connectionUrl.searchParams.has("tls") &&
    !connectionUrl.searchParams.has("ssl")
  ) {
    connectionUrl.searchParams.set("tls", "true");
  }

  const credentials = connectionUrl.username
    ? `${connectionUrl.username}${connectionUrl.password ? `:${connectionUrl.password}` : ""}@`
    : "";
  const query = connectionUrl.searchParams.toString();
  const connectionString = `mongodb://${credentials}${hosts.join(",")}${connectionUrl.pathname}${query ? `?${query}` : ""}`;

  return new MongoClient(connectionString);
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    if (dnsServers.some((server) => !server)) {
      throw new Error("MONGODB_DNS_SERVERS contains an empty DNS server.");
    }
  }

  if (!globalForMongo.mongoClientPromise) {
    const connection = createMongoClient(uri, dnsServers).then((client) =>
      client.connect(),
    );
    globalForMongo.mongoClientPromise = connection.catch((error: unknown) => {
      globalForMongo.mongoClientPromise = undefined;
      throw error;
    });
  }

  const client = await globalForMongo.mongoClientPromise;
  const database = client.db(process.env.MONGODB_DB || "TF1SHOP");
  const users = database.collection<UserDocument>("users");

  if (!emailIndexPromise) {
    emailIndexPromise = users.createIndex({ email: 1 }, { unique: true });
  }

  try {
    await emailIndexPromise;
  } catch (error) {
    emailIndexPromise = undefined;
    throw error;
  }

  return users;
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const users = await getUsersCollection();
  return users.findOne(
    { _id: new ObjectId(id) },
    { projection: { passwordHash: 0 } },
  );
}

export function isDuplicateEmailError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === 11000;
}
