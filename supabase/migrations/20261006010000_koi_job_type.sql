-- Koi and fish care gets its own option on the quote form.
alter table public.quote_requests drop constraint quote_requests_job_type_check;
alter table public.quote_requests add constraint quote_requests_job_type_check
  check (job_type in ('pond', 'water-feature', 'pond-care', 'koi', 'handyman', 'not-sure'));
