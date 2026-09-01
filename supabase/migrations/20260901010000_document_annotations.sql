CREATE TABLE public.document_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'underline', 'strikethrough')),
  selected_text TEXT NOT NULL,
  geometry JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX document_annotations_document_page_idx ON public.document_annotations (document_id, page_number, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_annotations TO authenticated;
GRANT ALL ON public.document_annotations TO service_role;

ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own document annotations" ON public.document_annotations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own document annotations" ON public.document_annotations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document annotations" ON public.document_annotations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document annotations" ON public.document_annotations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_document_annotations_updated_at
BEFORE UPDATE ON public.document_annotations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
