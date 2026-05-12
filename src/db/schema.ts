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
    // Set when this entry was imported as part of a meal — all entries from
    // one meal-import share the same instance id, so the UI can group them.
    mealInstanceId: text("meal_instance_id"),
    mealName: text("meal_name"),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byUserDate: index("food_entries_user_date_idx").on(t.userId, t.date),
    byMealInstance: index("food_entries_meal_instance_idx").on(t.mealInstanceId),
  }),
);

export const meals = pgTable(
  "meals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    uniqByUserName: uniqueIndex("meals_user_name_uq").on(t.userId, t.name),
  }),
);

export const mealItems = pgTable(
  "meal_items",
  {
    id: text("id").primaryKey(),
    mealId: text("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    grams: real("grams").notNull(),
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
    byMeal: index("meal_items_meal_idx").on(t.mealId),
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
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type MealItem = typeof mealItems.$inferSelect;
export type NewMealItem = typeof mealItems.$inferInsert;
