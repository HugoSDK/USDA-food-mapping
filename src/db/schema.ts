import { pgTable, text, integer, real, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export const foodEntries = pgTable(
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
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byUserDate: index("food_entries_user_date_idx").on(t.userId, t.date),
  }),
);

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    kg: real("kg").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
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
