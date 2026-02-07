import fs from "fs/promises";
import process from "process";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const usage = () => {
  console.log(
    [
      "Usage:",
      "  node scripts/add-admin.mjs <uid|email>",
      "",
      "Env:",
      "  FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json",
      "  or",
      "  FIREBASE_SERVICE_ACCOUNT_JSON='{\"project_id\":\"...\"...}'",
    ].join("\n"),
  );
};

const loadServiceAccount = async () => {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    return JSON.parse(jsonEnv);
  }

  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (pathEnv) {
    const raw = await fs.readFile(pathEnv, "utf8");
    return JSON.parse(raw);
  }

  throw new Error(
    "Missing service account. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.",
  );
};

const main = async () => {
  const identifier = process.argv[2];
  if (!identifier) {
    usage();
    process.exit(1);
  }

  const serviceAccount = await loadServiceAccount();

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  const userRecord = identifier.includes("@")
    ? await auth.getUserByEmail(identifier)
    : await auth.getUser(identifier);

  const adminRef = db.collection("admins").doc(userRecord.uid);
  await adminRef.set(
    {
      uid: userRecord.uid,
      email: userRecord.email ?? null,
      grantedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(
    `Admin access granted for ${userRecord.email ?? userRecord.uid}`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
