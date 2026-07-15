import { openDB } from "idb";

const DB_NAME = "job-tracker";
const DB_VERSION = 1;
const STORE = "jobs";

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("status", "status");
          store.createIndex("dateApplied", "dateApplied");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllJobs() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function addJob(job) {
  const db = await getDB();
  await db.add(STORE, job);
}

export async function updateJob(job) {
  const db = await getDB();
  await db.put(STORE, job);
}

export async function deleteJob(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function exportAllJobs() {
  return getAllJobs();
}

export async function importJobs(jobs) {
  const db = await getDB();
  const tx = db.transaction(STORE, "readwrite");
  await Promise.all([...jobs.map((j) => tx.store.put(j)), tx.done]);
}
