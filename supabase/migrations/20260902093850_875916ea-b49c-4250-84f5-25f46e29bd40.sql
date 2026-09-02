CREATE TABLE IF NOT EXISTS public.document_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight','underline','strikethrough')),
  selected_text TEXT NOT NULL DEFAULT '',
  geometry JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_annotations TO authenticated;
GRANT ALL ON public.document_annotations TO service_role;

ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own annotations"
  ON public.document_annotations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS document_annotations_document_id_idx
  ON public.document_annotations(document_id);

CREATE TRIGGER update_document_annotations_updated_at
  BEFORE UPDATE ON public.document_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  ADD COLUMN IF NOT EXISTS resume_reading BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS export_include_source BOOLEAN NOT NULL DEFAULT true;