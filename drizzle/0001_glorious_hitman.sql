CREATE TABLE IF NOT EXISTS "meal_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meal_id" text NOT NULL,
	"description" text NOT NULL,
	"grams" real NOT NULL,
	"fdc_id" integer NOT NULL,
	"food_name" text NOT NULL,
	"kcal_per_100g" real NOT NULL,
	"protein_per_100g" real NOT NULL,
	"carbs_per_100g" real NOT NULL,
	"fat_per_100g" real NOT NULL,
	"fiber_per_100g" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "meal_instance_id" text;--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "meal_name" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_items_meal_idx" ON "meal_items" USING btree ("meal_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "meals_user_name_uq" ON "meals" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "food_entries_meal_instance_idx" ON "food_entries" USING btree ("meal_instance_id");