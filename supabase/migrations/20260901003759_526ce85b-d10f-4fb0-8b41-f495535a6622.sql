CREATE TABLE public.document_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_notes TO authenticated;
GRANT ALL ON public.document_notes TO service_role;

ALTER TABLE public.document_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document notes" ON public.document_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own document notes" ON public.document_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document notes" ON public.document_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document notes" ON public.document_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_document_notes_updated_at
BEFORE UPDATE ON public.document_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();