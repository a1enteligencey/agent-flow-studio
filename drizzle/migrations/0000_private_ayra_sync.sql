CREATE TABLE public.ayra_items (
 user_id uuid NOT NULL,
 collection text NOT NULL CHECK (collection IN ('agents','modules','tasks')),
 id text NOT NULL,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,collection,id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ayra_items TO authenticated;
GRANT ALL ON public.ayra_items TO service_role;
ALTER TABLE public.ayra_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own items" ON public.ayra_items FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE TABLE public.ayra_workspaces (
 user_id uuid PRIMARY KEY,
 initialized boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT ON public.ayra_workspaces TO authenticated;
GRANT ALL ON public.ayra_workspaces TO service_role;
ALTER TABLE public.ayra_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own workspace" ON public.ayra_workspaces FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Create own workspace" ON public.ayra_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE FUNCTION public.ayra_sync_doorbell() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM realtime.send('{}'::jsonb, 'changed', 'ayra:' || COALESCE(NEW.user_id, OLD.user_id)::text, true);
 RETURN NULL;
END; $$;
CREATE TRIGGER ayra_sync_changed AFTER INSERT OR UPDATE OR DELETE ON public.ayra_items FOR EACH ROW EXECUTE FUNCTION public.ayra_sync_doorbell();
CREATE POLICY "Own AYRA notifications" ON realtime.messages FOR SELECT TO authenticated USING (realtime.topic() = 'ayra:' || (select auth.uid())::text);