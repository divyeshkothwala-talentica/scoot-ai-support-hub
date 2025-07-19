-- Create function to increment FAQ view count
CREATE OR REPLACE FUNCTION public.increment_faq_view_count(faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.faq_articles 
  SET view_count = view_count + 1 
  WHERE id = faq_id;
END;
$$;