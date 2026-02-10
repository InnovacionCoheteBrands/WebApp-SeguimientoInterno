ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS quotation_amount numeric(12, 2);

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS monthly_maintenance numeric(12, 2);

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS start_date timestamp;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS cover_image_url text;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS cover_color text DEFAULT '#3B82F6';

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS additional_notes text;
