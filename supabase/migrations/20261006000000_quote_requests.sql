-- Rogue Valley Ponds & Handyman: quote requests from the website.
--
-- The public (publishable key) can only call submit_quote_request(). It can
-- never read the table, so customers' names, phone numbers and addresses stay
-- private; Robert reads them in the Supabase dashboard.

create table public.quote_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  phone        text not null check (char_length(btrim(phone)) between 7 and 30),
  email        text check (email is null or char_length(email) <= 200),
  town         text check (town is null or char_length(town) <= 80),
  job_type     text not null check (job_type in ('pond', 'water-feature', 'pond-care', 'handyman', 'not-sure')),
  details      text not null check (char_length(btrim(details)) between 1 and 2000),
  best_time    text check (best_time is null or char_length(best_time) <= 40),
  status       text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost'))
);

create index quote_requests_created_at_idx on public.quote_requests (created_at desc);

-- RLS on with no policies, and no table rights for the public roles.
alter table public.quote_requests enable row level security;
revoke all on public.quote_requests from anon, authenticated;

create or replace function public.submit_quote_request(
  p_name      text,
  p_phone     text,
  p_job_type  text,
  p_details   text,
  p_email     text default null,
  p_town      text default null,
  p_best_time text default null
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_row quote_requests;
begin
  -- A light brake on repeat submissions from the same number.
  if (select count(*) from quote_requests
      where phone = btrim(p_phone) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests from this number. Please call or text instead.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  insert into quote_requests (name, phone, email, town, job_type, details, best_time)
  values (btrim(p_name), btrim(p_phone), nullif(btrim(p_email), ''), nullif(btrim(p_town), ''),
          p_job_type, btrim(p_details), nullif(btrim(p_best_time), ''))
  returning * into v_row;

  return json_build_object('id', v_row.id, 'created_at', v_row.created_at);
end;
$$;

revoke all on function public.submit_quote_request(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_quote_request(text, text, text, text, text, text, text) to anon, authenticated;
