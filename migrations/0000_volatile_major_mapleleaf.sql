CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_code" text NOT NULL,
	"name" text NOT NULL,
	"client_name" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'Planning' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"priority" text DEFAULT 'Medium' NOT NULL,
	"budget" integer DEFAULT 0 NOT NULL,
	"spend" integer DEFAULT 0 NOT NULL,
	"target_audience" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_campaign_code_unique" UNIQUE("campaign_code")
);
--> statement-breakpoint
CREATE TABLE "client_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"company_name" text NOT NULL,
	"industry" text NOT NULL,
	"monthly_budget" integer NOT NULL,
	"current_spend" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 100 NOT NULL,
	"next_milestone" text,
	"last_contact" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_name" text NOT NULL,
	"resource_type" text NOT NULL,
	"status" text NOT NULL,
	"owner" text,
	"last_updated" timestamp,
	"storage_used" integer,
	"storage_total" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"trend" text,
	"trend_label" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"department" text NOT NULL,
	"status" text DEFAULT 'Available' NOT NULL,
	"avatar_url" text,
	"work_hours_start" text NOT NULL,
	"work_hours_end" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;