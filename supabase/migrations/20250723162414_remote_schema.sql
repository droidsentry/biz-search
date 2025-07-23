

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cached_uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT auth.uid()
$$;


ALTER FUNCTION "public"."cached_uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_old_search_api_logs"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM search_api_logs 
  WHERE created_at < (now() - interval '6 months');
END;
$$;


ALTER FUNCTION "public"."delete_old_search_api_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_api_usage"("p_project_id" "uuid", "p_period" interval DEFAULT '30 days'::interval) RETURNS TABLE("date" "date", "total_requests" bigint, "successful_requests" bigint, "avg_response_time" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code = 200 THEN 1 END) as successful_requests,
    AVG(api_response_time)::numeric as avg_response_time
  FROM search_api_logs
  WHERE project_id = p_project_id
    AND created_at >= CURRENT_DATE - p_period
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
$$;


ALTER FUNCTION "public"."get_project_api_usage"("p_project_id" "uuid", "p_period" interval) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_project_export_data"("p_project_id" "uuid") RETURNS TABLE("property_address" "text", "owner_name" "text", "owner_address" "text", "owner_lat" numeric, "owner_lng" numeric, "company_1_name" "text", "company_1_number" "text", "company_1_position" "text", "company_2_name" "text", "company_2_number" "text", "company_2_position" "text", "company_3_name" "text", "company_3_number" "text", "company_3_position" "text", "ownership_start" timestamp with time zone, "import_date" timestamp with time zone, "researched_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.address,
    o.name,
    o.address,
    o.lat,
    o.lng,
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 1 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 2 THEN oc.position END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_name END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.company_number END),
    MAX(CASE WHEN oc.rank = 3 THEN oc.position END),
    po.ownership_start,
    pp.added_at,
    MAX(oc.researched_at)
  FROM project_properties pp
  JOIN properties p ON pp.property_id = p.id
  LEFT JOIN property_ownerships po ON p.id = po.property_id AND po.is_current = true
  LEFT JOIN owners o ON po.owner_id = o.id
  LEFT JOIN owner_companies oc ON o.id = oc.owner_id
  WHERE pp.project_id = p_project_id
  GROUP BY p.id, p.address, po.ownership_start, o.id, o.name, o.address, o.lat, o.lng, pp.added_at
  ORDER BY pp.added_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_project_export_data"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_patterns_with_stats"("p_user_id" "uuid") RETURNS TABLE("pattern_id" "uuid", "pattern_name" "text", "total_usage_count" integer, "last_30_days_count" bigint, "last_used_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    sp.id,
    sp.name,
    sp.usage_count as total_usage_count,
    COUNT(DISTINCT sal.id) as last_30_days_count,
    sp.last_used_at
  FROM search_patterns sp
  LEFT JOIN search_api_logs sal
    ON sp.id = sal.pattern_id
    AND sal.status_code = 200
    AND sal.created_at >= CURRENT_DATE - INTERVAL '30 days'
  WHERE sp.user_id = p_user_id
  GROUP BY sp.id, sp.name, sp.usage_count, sp.last_used_at;
$$;


ALTER FUNCTION "public"."get_user_patterns_with_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_search_pattern_usage"("pattern_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE search_patterns 
  SET usage_count = usage_count + 1,
      last_used_at = now()
  WHERE id = pattern_id;
END;
$$;


ALTER FUNCTION "public"."increment_search_pattern_usage"("pattern_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_system_owner"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'system_owner'
  );
$$;


ALTER FUNCTION "public"."is_system_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pattern_usage_on_log_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.pattern_id IS NOT NULL THEN
    PERFORM increment_search_pattern_usage(NEW.pattern_id);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pattern_usage_on_log_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_property_ownership"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- INSERT時のみ処理（UPDATEは既存レコードの更新なので何もしない）
  IF TG_OP = 'INSERT' THEN
    -- 同じproperty_idで異なるowner_idの既存レコードを終了
    UPDATE property_ownerships 
    SET 
      is_current = false, 
      ownership_end = NEW.ownership_start,
      updated_at = now()
    WHERE 
      property_id = NEW.property_id 
      AND owner_id != NEW.owner_id
      AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_property_ownership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_accessible_projects"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm WHERE pm.user_id = (SELECT auth.uid())
$$;


ALTER FUNCTION "public"."user_accessible_projects"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_editable_projects"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT p.id FROM projects p WHERE p.created_by = (SELECT auth.uid())
  UNION
  SELECT pm.project_id FROM project_members pm 
  WHERE pm.user_id = (SELECT auth.uid()) AND pm.role IN ('owner', 'editor')
$$;


ALTER FUNCTION "public"."user_editable_projects"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."owner_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "company_number" "text",
    "position" "text",
    "source_url" "text" NOT NULL,
    "rank" integer NOT NULL,
    "is_verified" boolean DEFAULT false,
    "researched_by" "uuid" NOT NULL,
    "researched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "owner_companies_rank_check" CHECK ((("rank" >= 1) AND ("rank" <= 3)))
);


ALTER TABLE "public"."owner_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lat" numeric(10,8),
    "lng" numeric(11,8),
    "street_view_available" boolean DEFAULT false
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "email" "text" NOT NULL,
    "username" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['system_owner'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "import_source_file" "text"
);


ALTER TABLE "public"."project_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_ownerships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "ownership_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ownership_end" timestamp with time zone,
    "is_current" boolean DEFAULT true,
    "source" "text",
    "recorded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "property_ownerships_check" CHECK ((("ownership_end" IS NULL) OR ("ownership_end" >= "ownership_start"))),
    CONSTRAINT "property_ownerships_check_dates" CHECK ((("ownership_end" IS NULL) OR ("ownership_end" >= "ownership_start"))),
    CONSTRAINT "property_ownerships_ownership_end_check" CHECK ((("ownership_end" IS NULL) OR ("ownership_end" >= "ownership_start")))
);


ALTER TABLE "public"."property_ownerships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_api_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "pattern_id" "uuid",
    "project_id" "uuid",
    "google_custom_search_params" "jsonb" NOT NULL,
    "result_count" integer,
    "error_message" "text",
    "status_code" integer NOT NULL,
    "api_response_time" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."search_api_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."search_api_logs" IS 'Google Custom Search API使用履歴（プロジェクト毎のAPI使用量監視用）';



COMMENT ON COLUMN "public"."search_api_logs"."pattern_id" IS '使用された検索パターン（パターンからの実行時に記録）';



COMMENT ON COLUMN "public"."search_api_logs"."project_id" IS 'API呼び出しが属するプロジェクト（削除時はNULL設定で履歴保持）';



COMMENT ON COLUMN "public"."search_api_logs"."google_custom_search_params" IS 'API送信時の完全な検索パラメータ（検索クエリを含む）';



COMMENT ON COLUMN "public"."search_api_logs"."api_response_time" IS 'APIレスポンス時間（ミリ秒単位）';



CREATE TABLE IF NOT EXISTS "public"."search_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "google_custom_search_params" "jsonb" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "public"."search_patterns" OWNER TO "postgres";


COMMENT ON TABLE "public"."search_patterns" IS 'ユーザーの個人検索パターン（複数プロジェクトで再利用可能）';



COMMENT ON COLUMN "public"."search_patterns"."usage_count" IS '使用回数カウンタ（ダッシュボードでの高速表示用。search_api_logsとの結合によるパフォーマンス低下を回避）';



COMMENT ON COLUMN "public"."search_patterns"."last_used_at" IS 'パターンの最終使用日時（一覧表示のソート用）';



ALTER TABLE ONLY "public"."owner_companies"
    ADD CONSTRAINT "owner_companies_owner_id_rank_key" UNIQUE ("owner_id", "rank");



ALTER TABLE ONLY "public"."owner_companies"
    ADD CONSTRAINT "owner_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_name_address_key" UNIQUE ("name", "address");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_properties"
    ADD CONSTRAINT "project_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_properties"
    ADD CONSTRAINT "project_properties_project_id_property_id_key" UNIQUE ("project_id", "property_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_address_key" UNIQUE ("address");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_ownerships"
    ADD CONSTRAINT "property_ownerships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_ownerships"
    ADD CONSTRAINT "property_ownerships_property_id_owner_id_key" UNIQUE ("property_id", "owner_id");



ALTER TABLE ONLY "public"."search_api_logs"
    ADD CONSTRAINT "search_api_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_patterns"
    ADD CONSTRAINT "search_patterns_name_user_unique" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."search_patterns"
    ADD CONSTRAINT "search_patterns_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_api_logs_created_at" ON "public"."search_api_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_api_logs_pattern" ON "public"."search_api_logs" USING "btree" ("pattern_id");



CREATE INDEX "idx_api_logs_project_date" ON "public"."search_api_logs" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "idx_api_logs_status" ON "public"."search_api_logs" USING "btree" ("status_code");



CREATE INDEX "idx_api_logs_user_date" ON "public"."search_api_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_owners_address" ON "public"."owners" USING "btree" ("address");



CREATE INDEX "idx_owners_name" ON "public"."owners" USING "btree" ("name");



CREATE INDEX "idx_project_properties_project" ON "public"."project_properties" USING "btree" ("project_id");



CREATE INDEX "idx_project_properties_property" ON "public"."project_properties" USING "btree" ("property_id");



CREATE INDEX "idx_property_ownerships_current" ON "public"."property_ownerships" USING "btree" ("property_id") WHERE ("is_current" = true);



CREATE INDEX "idx_property_ownerships_owner" ON "public"."property_ownerships" USING "btree" ("owner_id");



CREATE INDEX "idx_property_ownerships_property" ON "public"."property_ownerships" USING "btree" ("property_id");



CREATE INDEX "idx_search_patterns_last_used" ON "public"."search_patterns" USING "btree" ("user_id", "last_used_at" DESC);



CREATE INDEX "idx_search_patterns_user_id" ON "public"."search_patterns" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "ensure_single_current_owner" BEFORE INSERT ON "public"."property_ownerships" FOR EACH ROW EXECUTE FUNCTION "public"."update_property_ownership"();



CREATE OR REPLACE TRIGGER "increment_usage_count_on_api_log" AFTER INSERT ON "public"."search_api_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_pattern_usage_on_log_insert"();



CREATE OR REPLACE TRIGGER "update_owner_companies_updated_at" BEFORE UPDATE ON "public"."owner_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_owners_updated_at" BEFORE UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_property_ownerships_updated_at" BEFORE UPDATE ON "public"."property_ownerships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_search_patterns_updated_at" BEFORE UPDATE ON "public"."search_patterns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."owner_companies"
    ADD CONSTRAINT "owner_companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_companies"
    ADD CONSTRAINT "owner_companies_researched_by_fkey" FOREIGN KEY ("researched_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_properties"
    ADD CONSTRAINT "project_properties_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_properties"
    ADD CONSTRAINT "project_properties_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_properties"
    ADD CONSTRAINT "project_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."property_ownerships"
    ADD CONSTRAINT "property_ownerships_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_ownerships"
    ADD CONSTRAINT "property_ownerships_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_ownerships"
    ADD CONSTRAINT "property_ownerships_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."search_api_logs"
    ADD CONSTRAINT "search_api_logs_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "public"."search_patterns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."search_api_logs"
    ADD CONSTRAINT "search_api_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."search_api_logs"
    ADD CONSTRAINT "search_api_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_patterns"
    ADD CONSTRAINT "search_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Editors can update owners" ON "public"."owners" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects"))))))));



ALTER TABLE "public"."owner_companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_companies_delete" ON "public"."owner_companies" FOR DELETE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("owner_id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "p"."id"
                   FROM "public"."projects" "p"
                  WHERE ("p"."created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid"))))))))));



CREATE POLICY "owner_companies_insert" ON "public"."owner_companies" FOR INSERT TO "authenticated" WITH CHECK ((("researched_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")) AND (( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("owner_id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects")))))))));



CREATE POLICY "owner_companies_select" ON "public"."owner_companies" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("owner_id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))))))));



CREATE POLICY "owner_companies_update" ON "public"."owner_companies" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("owner_id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects"))))))));



ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_insert" ON "public"."owners" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "owners_select" ON "public"."owners" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("id" IN ( SELECT DISTINCT "po"."owner_id"
   FROM "public"."property_ownerships" "po"
  WHERE ("po"."property_id" IN ( SELECT "pp"."property_id"
           FROM "public"."project_properties" "pp"
          WHERE ("pp"."project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "public"."cached_uid"() AS "cached_uid")));



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT "public"."cached_uid"() AS "cached_uid")) OR ( SELECT "public"."is_system_owner"() AS "is_system_owner")));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "public"."cached_uid"() AS "cached_uid")) OR ( SELECT "public"."is_system_owner"() AS "is_system_owner"))) WITH CHECK ((("id" = ( SELECT "public"."cached_uid"() AS "cached_uid")) OR ( SELECT "public"."is_system_owner"() AS "is_system_owner")));



ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_members_delete" ON "public"."project_members" FOR DELETE TO "authenticated" USING ((("user_id" <> ( SELECT "public"."cached_uid"() AS "cached_uid")) AND (( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "p"."id"
   FROM "public"."projects" "p"
  WHERE ("p"."created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")))))));



CREATE POLICY "project_members_insert" ON "public"."project_members" FOR INSERT TO "authenticated" WITH CHECK ((("added_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")) AND (( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "p"."id"
   FROM "public"."projects" "p"
  WHERE ("p"."created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")))))));



CREATE POLICY "project_members_select" ON "public"."project_members" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("user_id" = ( SELECT "public"."cached_uid"() AS "cached_uid")) OR ("project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))));



CREATE POLICY "project_members_update" ON "public"."project_members" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "p"."id"
   FROM "public"."projects" "p"
  WHERE ("p"."created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid"))))));



ALTER TABLE "public"."project_properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_properties_delete" ON "public"."project_properties" FOR DELETE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "p"."id"
   FROM "public"."projects" "p"
  WHERE ("p"."created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid"))))));



CREATE POLICY "project_properties_insert" ON "public"."project_properties" FOR INSERT TO "authenticated" WITH CHECK ((("added_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")) AND (( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects")))));



CREATE POLICY "project_properties_select" ON "public"."project_properties" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_delete" ON "public"."projects" FOR DELETE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid"))));



CREATE POLICY "projects_insert" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")));



CREATE POLICY "projects_select" ON "public"."projects" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")) OR ("id" IN ( SELECT "project_members"."project_id"
   FROM "public"."project_members"
  WHERE ("project_members"."user_id" = ( SELECT "public"."cached_uid"() AS "cached_uid"))))));



CREATE POLICY "projects_update" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("created_by" = ( SELECT "public"."cached_uid"() AS "cached_uid"))));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_insert" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "properties_select" ON "public"."properties" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("id" IN ( SELECT "pp"."property_id"
   FROM "public"."project_properties" "pp"
  WHERE ("pp"."project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))))));



CREATE POLICY "properties_update" ON "public"."properties" FOR UPDATE TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("id" IN ( SELECT "pp"."property_id"
   FROM "public"."project_properties" "pp"
  WHERE ("pp"."project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects"))))));



ALTER TABLE "public"."property_ownerships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "property_ownerships_insert" ON "public"."property_ownerships" FOR INSERT TO "authenticated" WITH CHECK ((("recorded_by" = ( SELECT "public"."cached_uid"() AS "cached_uid")) AND (( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("property_id" IN ( SELECT "pp"."property_id"
   FROM "public"."project_properties" "pp"
  WHERE ("pp"."project_id" IN ( SELECT "public"."user_editable_projects"() AS "user_editable_projects")))))));



CREATE POLICY "property_ownerships_select" ON "public"."property_ownerships" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_system_owner"() AS "is_system_owner") OR ("property_id" IN ( SELECT "pp"."property_id"
   FROM "public"."project_properties" "pp"
  WHERE ("pp"."project_id" IN ( SELECT "public"."user_accessible_projects"() AS "user_accessible_projects"))))));



ALTER TABLE "public"."search_api_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_api_logs_insert" ON "public"."search_api_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



COMMENT ON POLICY "search_api_logs_insert" ON "public"."search_api_logs" IS '認証済みユーザーはプロジェクトIDの有無に関わらずAPIログを記録可能（テスト、デモ、個人利用等をサポート）';



CREATE POLICY "search_api_logs_select" ON "public"."search_api_logs" FOR SELECT TO "authenticated" USING ("public"."is_system_owner"());



ALTER TABLE "public"."search_patterns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "search_patterns_delete" ON "public"."search_patterns" FOR DELETE TO "authenticated" USING (("public"."is_system_owner"() OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "search_patterns_insert" ON "public"."search_patterns" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "search_patterns_select" ON "public"."search_patterns" FOR SELECT TO "authenticated" USING (("public"."is_system_owner"() OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "search_patterns_update" ON "public"."search_patterns" FOR UPDATE TO "authenticated" USING (("public"."is_system_owner"() OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."cached_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."cached_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cached_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_search_api_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_search_api_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_search_api_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_api_usage"("p_project_id" "uuid", "p_period" interval) TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_api_usage"("p_project_id" "uuid", "p_period" interval) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_api_usage"("p_project_id" "uuid", "p_period" interval) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_project_export_data"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_project_export_data"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_project_export_data"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_patterns_with_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_patterns_with_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_patterns_with_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_search_pattern_usage"("pattern_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_search_pattern_usage"("pattern_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_search_pattern_usage"("pattern_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_system_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_system_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_system_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pattern_usage_on_log_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pattern_usage_on_log_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pattern_usage_on_log_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_property_ownership"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_property_ownership"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_property_ownership"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_accessible_projects"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_accessible_projects"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_accessible_projects"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_editable_projects"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_editable_projects"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_editable_projects"() TO "service_role";
























GRANT ALL ON TABLE "public"."owner_companies" TO "anon";
GRANT ALL ON TABLE "public"."owner_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_companies" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_properties" TO "anon";
GRANT ALL ON TABLE "public"."project_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."project_properties" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_ownerships" TO "anon";
GRANT ALL ON TABLE "public"."property_ownerships" TO "authenticated";
GRANT ALL ON TABLE "public"."property_ownerships" TO "service_role";



GRANT ALL ON TABLE "public"."search_api_logs" TO "anon";
GRANT ALL ON TABLE "public"."search_api_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_api_logs" TO "service_role";



GRANT ALL ON TABLE "public"."search_patterns" TO "anon";
GRANT ALL ON TABLE "public"."search_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."search_patterns" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
