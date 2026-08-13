CREATE OR REPLACE FUNCTION public.delete_pos_shift(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _s public.pos_shifts;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Only admins can delete work shifts'; END IF;

  SELECT * INTO _s FROM public.pos_shifts WHERE id = _id;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'Shift not found'; END IF;
  IF _s.status = 'open' THEN RAISE EXCEPTION 'Close the shift before deleting it'; END IF;

  UPDATE public.pos_sales SET shift_id = NULL WHERE shift_id = _id;
  DELETE FROM public.pos_shifts WHERE id = _id;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity, entity_id, details)
  VALUES (_uid, _s.opened_email, 'pos.shift_deleted', 'pos_shifts', _id::text,
          jsonb_build_object('opened_at', _s.opened_at, 'sales_count', _s.sales_count));
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_pos_shift(uuid) TO authenticated;