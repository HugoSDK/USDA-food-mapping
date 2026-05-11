import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const foodEntries = sqliteTable(
  "food_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // YYYY-MM-DD in user's local timezone
    date: text("date").notNull(),
    // What the client typed
    description: text("description").notNull(),
    grams: real("grams").notNull(),
    // USDA reference + snapshotted nutrient values per 100g
    fdcId: integer("fdc_id").notNull(),
    foodName: text("food_name").notNull(),
    kcalPer100g: real("kcal_per_100g").notNull(),
    proteinPer100g: real("protein_per_100g").notNull(),
    carbsPer100g: real("carbs_per_100g").notNull(),
    fatPer100g: real("fat_per_100g").notNull(),
    fiberPer100g: real("fiber_per_100g").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    byUserDate: index("food_entries_user_date_idx").on(t.userId, t.date),
  }),
);

export const weightEntries = sqliteTable(
  "weight_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    kg: real("kg").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqByUserDate: uniqueIndex("weight_entries_user_date_uq").on(t.userId, t.date),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type NewWeightEntry = typeof weightEntries.$inferInsert;
