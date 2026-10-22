ALTER TABLE "sessions" DROP CONSTRAINT "sessions_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;