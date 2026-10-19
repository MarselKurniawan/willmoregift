CREATE OR REPLACE FUNCTION public.protect_special_grand_prize()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.code = 'WL95534656' THEN
      RAISE EXCEPTION 'Kode hadiah utama tidak dapat dihapus';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.code = 'WL95534656' AND NEW.code IS DISTINCT FROM OLD.code THEN
      RAISE EXCEPTION 'Kode hadiah utama tidak dapat diganti';
    END IF;
  END IF;
  IF NEW.code = 'WL95534656' THEN
    NEW.prize := 'pintu_hq';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_special_grand_prize
BEFORE INSERT OR UPDATE OR DELETE ON public.codes
FOR EACH ROW EXECUTE FUNCTION public.protect_special_grand_prize();