-- D1 Database Schema for Leonard
-- Run with: wrangler d1 execute leonard-db --file=./prisma/d1-schema.sql

CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebaseUid TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  displayName TEXT,
  photoUrl TEXT,
  provider TEXT,
  yachtName TEXT,
  yachtType TEXT,
  yachtLength TEXT,
  homePort TEXT,
  preferences TEXT,
  createdAt DATETIME DEFAULT (datetime('now')),
  updatedAt DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Trip (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  startDate TEXT,
  endDate TEXT,
  duration TEXT,
  distance TEXT,
  planData TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  createdAt DATETIME DEFAULT (datetime('now')),
  updatedAt DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_user_firebase_uid ON User(firebaseUid);
CREATE INDEX IF NOT EXISTS idx_trip_user_id ON Trip(userId);
CREATE INDEX IF NOT EXISTS idx_trip_status ON Trip(status);
