CREATE TABLE public.document_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'other',
  title text NOT NULL DEFAULT '',
  authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_year integer,
  publisher_or_journal text NOT NULL DEFAULT '',
  doi_or_url text NOT NULL DEFAULT '',
  volume text NOT NULL DEFAULT '',
  issue text NOT NULL DEFAULT '',
  pages text NOT NULL DEFAULT '',
  accessed_date date,
  citation_key text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_citations TO authenticated;
GRANT ALL ON public.document_citations TO service_role;
ALTER TABLE public.document_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own document citations"
  ON public.document_citations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER document_citations_set_updated_at
  BEFORE UPDATE ON public.document_citations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.note_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  citation_key text NOT NULL DEFAULT '',
  reference_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_references TO authenticated;
GRANT ALL ON public.note_references TO service_role;
ALTER TABLE public.note_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own note references"
  ON public.note_references FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER note_references_set_updated_at
  BEFORE UPDATE ON public.note_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX note_references_document_id_idx ON public.note_references(document_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS citation_style text NOT NULL DEFAULT 'apa';