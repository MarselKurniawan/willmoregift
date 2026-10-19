CREATE TABLE public.draw_days (
  day_number int PRIMARY KEY CHECK (day_number BETWEEN 1 AND 4),
  announce_date date NOT NULL,
  drawn_at timestamptz
);
GRANT ALL ON public.draw_days TO service_role;
ALTER TABLE public.draw_days ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.codes (
  code text PRIMARY KEY,
  day_number int NOT NULL REFERENCES public.draw_days(day_number) ON DELETE CASCADE,
  prize text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.codes TO service_role;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.draw_days (day_number, announce_date) VALUES
 (1, '2026-10-20'), (2, '2026-10-21'), (3, '2026-10-22'), (4, '2026-10-23');