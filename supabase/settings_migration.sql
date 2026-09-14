alter table public.workspace_settings
  add column if not exists theme text not null default 'light',
  add column if not exists font_size text not null default 'medium';

update public.workspace_settings
set theme = coalesce(theme, 'light'),
    font_size = coalesce(font_size, 'medium')
where id = 'default';
