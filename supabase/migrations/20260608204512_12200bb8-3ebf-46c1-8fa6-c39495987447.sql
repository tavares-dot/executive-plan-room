
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('admin', 'head', 'gestor', 'sdr', 'closer', 'viewer');
CREATE TYPE public.semaforo AS ENUM ('excelente', 'saudavel', 'atencao', 'critico');
CREATE TYPE public.opp_stage AS ENUM ('Prospec','Qualificado','Reuniao','Proposta','Negociacao','Fechado-Ganho','Fechado-Perdido');
CREATE TYPE public.kanban_col AS ENUM ('inbox','prioridade','andamento','aguardando','bloqueado','revisar','validado','concluido');
CREATE TYPE public.prioridade AS ENUM ('baixa','media','alta','critica');

-- ===== UPDATED_AT =====
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','head','gestor']::public.app_role[])
$$;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _is_first BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO _is_first;
  IF _is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles admin insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_manager(auth.uid()));

-- ===== REFERENCE TABLES =====
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ticket_base NUMERIC(14,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products read" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products manage" ON public.products FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.origins TO authenticated;
GRANT ALL ON public.origins TO service_role;
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "origins read" ON public.origins FOR SELECT TO authenticated USING (true);
CREATE POLICY "origins manage" ON public.origins FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  meta_receita NUMERIC(14,2) DEFAULT 0,
  ordem INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sprints TO authenticated;
GRANT ALL ON public.sprints TO service_role;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sprints read" ON public.sprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "sprints manage" ON public.sprints FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INT NOT NULL,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  meta_receita NUMERIC(14,2) NOT NULL DEFAULT 0,
  contratos_necessarios INT NOT NULL DEFAULT 0,
  ticket_alvo NUMERIC(14,2) NOT NULL DEFAULT 0,
  dias_uteis INT NOT NULL DEFAULT 22,
  UNIQUE(ano, mes)
);
GRANT SELECT ON public.monthly_targets TO authenticated;
GRANT ALL ON public.monthly_targets TO service_role;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "targets read" ON public.monthly_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "targets manage" ON public.monthly_targets FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.thresholds (
  id INT PRIMARY KEY DEFAULT 1,
  taxa_conexao_min NUMERIC(6,2) NOT NULL DEFAULT 10,
  taxa_conexao_critico NUMERIC(6,2) NOT NULL DEFAULT 8,
  taxa_agendamento_min NUMERIC(6,2) NOT NULL DEFAULT 25,
  show_rate_min NUMERIC(6,2) NOT NULL DEFAULT 60,
  win_rate_min NUMERIC(6,2) NOT NULL DEFAULT 30,
  sla_max_horas NUMERIC(6,2) NOT NULL DEFAULT 2,
  leads_parados_max INT NOT NULL DEFAULT 25,
  plan_b_min_pct NUMERIC(6,2) NOT NULL DEFAULT 50,
  ticket_alvo NUMERIC(14,2) NOT NULL DEFAULT 20000,
  CHECK (id = 1)
);
GRANT SELECT ON public.thresholds TO authenticated;
GRANT ALL ON public.thresholds TO service_role;
ALTER TABLE public.thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thresholds read" ON public.thresholds FOR SELECT TO authenticated USING (true);
CREATE POLICY "thresholds manage" ON public.thresholds FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- ===== TEAM =====
CREATE TABLE public.sdrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  meta_ligacoes INT NOT NULL DEFAULT 0,
  meta_conexoes INT NOT NULL DEFAULT 0,
  meta_reunioes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sdrs TO authenticated;
GRANT ALL ON public.sdrs TO service_role;
ALTER TABLE public.sdrs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sdrs_updated BEFORE UPDATE ON public.sdrs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "sdrs read" ON public.sdrs FOR SELECT TO authenticated USING (true);
CREATE POLICY "sdrs manage" ON public.sdrs FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.closers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  meta_reunioes INT NOT NULL DEFAULT 0,
  meta_fechamentos INT NOT NULL DEFAULT 0,
  meta_receita NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.closers TO authenticated;
GRANT ALL ON public.closers TO service_role;
ALTER TABLE public.closers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_closers_updated BEFORE UPDATE ON public.closers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "closers read" ON public.closers FOR SELECT TO authenticated USING (true);
CREATE POLICY "closers manage" ON public.closers FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- ===== DAILY ENTRIES (núcleo) =====
CREATE TABLE public.daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  sdr_id UUID REFERENCES public.sdrs(id) ON DELETE SET NULL,
  closer_id UUID REFERENCES public.closers(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  tentativas INT NOT NULL DEFAULT 0,
  conexoes INT NOT NULL DEFAULT 0,
  agendamentos INT NOT NULL DEFAULT 0,
  reunioes_realizadas INT NOT NULL DEFAULT 0,
  no_show INT NOT NULL DEFAULT 0,
  negociacoes INT NOT NULL DEFAULT 0,
  propostas INT NOT NULL DEFAULT 0,
  fechamentos INT NOT NULL DEFAULT 0,
  receita NUMERIC(14,2) NOT NULL DEFAULT 0,
  sla_medio_horas NUMERIC(6,2) DEFAULT 0,
  leads_parados INT DEFAULT 0,
  observacoes TEXT,
  gargalos TEXT,
  aprendizados TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_data ON public.daily_entries(data);
CREATE INDEX idx_daily_sdr ON public.daily_entries(sdr_id);
CREATE INDEX idx_daily_closer ON public.daily_entries(closer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_entries TO authenticated;
GRANT ALL ON public.daily_entries TO service_role;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_daily_updated BEFORE UPDATE ON public.daily_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "daily read" ON public.daily_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily own insert" ON public.daily_entries FOR INSERT TO authenticated WITH CHECK (
  public.is_manager(auth.uid()) OR created_by = auth.uid()
);
CREATE POLICY "daily own update" ON public.daily_entries FOR UPDATE TO authenticated USING (
  public.is_manager(auth.uid()) OR created_by = auth.uid()
);
CREATE POLICY "daily admin delete" ON public.daily_entries FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

-- ===== MEETINGS =====
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  empresa TEXT NOT NULL,
  contato TEXT,
  origin_id UUID REFERENCES public.origins(id),
  closer_id UUID REFERENCES public.closers(id),
  sdr_id UUID REFERENCES public.sdrs(id),
  product_id UUID REFERENCES public.products(id),
  valor_estimado NUMERIC(14,2) DEFAULT 0,
  realizada BOOLEAN DEFAULT false,
  proposta_enviada BOOLEAN DEFAULT false,
  negociacao_aberta BOOLEAN DEFAULT false,
  fechou BOOLEAN DEFAULT false,
  receita_gerada NUMERIC(14,2) DEFAULT 0,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meetings_data ON public.meetings(data);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "meetings read" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetings insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "meetings update" ON public.meetings FOR UPDATE TO authenticated USING (public.is_manager(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "meetings delete" ON public.meetings FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

-- ===== CRM =====
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  setor TEXT,
  porte TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies read" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies manage" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts read" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts manage" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  origin_id UUID REFERENCES public.origins(id),
  sdr_id UUID REFERENCES public.sdrs(id),
  status TEXT NOT NULL DEFAULT 'novo',
  criticidade public.prioridade DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads read" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads manage" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  empresa TEXT NOT NULL,
  closer_id UUID REFERENCES public.closers(id),
  product_id UUID REFERENCES public.products(id),
  stage public.opp_stage NOT NULL DEFAULT 'Prospec',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  probability INT NOT NULL DEFAULT 20 CHECK (probability BETWEEN 0 AND 100),
  expected_close DATE,
  next_step TEXT,
  days_in_stage INT NOT NULL DEFAULT 0,
  criticidade public.prioridade DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_opps_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "opps read" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "opps manage" ON public.opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities read" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities manage" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== KANBAN =====
CREATE TABLE public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  coluna public.kanban_col NOT NULL DEFAULT 'inbox',
  prioridade public.prioridade NOT NULL DEFAULT 'media',
  area TEXT,
  responsavel_id UUID REFERENCES auth.users(id),
  due_date DATE,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  comentarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordem INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kanban_cards TO authenticated;
GRANT ALL ON public.kanban_cards TO service_role;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_kanban_updated BEFORE UPDATE ON public.kanban_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "kanban read" ON public.kanban_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "kanban manage" ON public.kanban_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== AUDIT =====
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  acao TEXT NOT NULL,
  antes JSONB,
  depois JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit manager read" ON public.audit_log FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));

-- ===== VIEWS AGREGADAS =====
CREATE OR REPLACE VIEW public.v_funnel_month AS
SELECT
  date_trunc('month', data)::date AS mes,
  SUM(tentativas)::bigint AS tentativas,
  SUM(conexoes)::bigint AS conexoes,
  SUM(agendamentos)::bigint AS agendamentos,
  SUM(reunioes_realizadas)::bigint AS reunioes,
  SUM(negociacoes)::bigint AS negociacoes,
  SUM(propostas)::bigint AS propostas,
  SUM(fechamentos)::bigint AS fechamentos,
  SUM(receita)::numeric AS receita,
  CASE WHEN SUM(tentativas) > 0 THEN ROUND(100.0 * SUM(conexoes)::numeric / SUM(tentativas), 2) ELSE 0 END AS taxa_conexao,
  CASE WHEN SUM(conexoes) > 0 THEN ROUND(100.0 * SUM(agendamentos)::numeric / SUM(conexoes), 2) ELSE 0 END AS taxa_agendamento,
  CASE WHEN SUM(agendamentos) > 0 THEN ROUND(100.0 * SUM(reunioes_realizadas)::numeric / SUM(agendamentos), 2) ELSE 0 END AS show_rate,
  CASE WHEN SUM(negociacoes) > 0 THEN ROUND(100.0 * SUM(fechamentos)::numeric / SUM(negociacoes), 2) ELSE 0 END AS win_rate,
  CASE WHEN SUM(fechamentos) > 0 THEN ROUND(SUM(receita) / SUM(fechamentos), 2) ELSE 0 END AS ticket_medio
FROM public.daily_entries
GROUP BY 1;
GRANT SELECT ON public.v_funnel_month TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_weekly_rollup AS
SELECT
  date_trunc('week', data)::date AS semana,
  SUM(tentativas)::bigint AS tentativas,
  SUM(conexoes)::bigint AS conexoes,
  SUM(agendamentos)::bigint AS agendamentos,
  SUM(reunioes_realizadas)::bigint AS reunioes,
  SUM(negociacoes)::bigint AS negociacoes,
  SUM(fechamentos)::bigint AS fechamentos,
  SUM(receita)::numeric AS receita,
  CASE WHEN SUM(tentativas)>0 THEN ROUND(100.0*SUM(conexoes)::numeric/SUM(tentativas),2) ELSE 0 END AS taxa_conexao,
  CASE WHEN SUM(conexoes)>0 THEN ROUND(100.0*SUM(agendamentos)::numeric/SUM(conexoes),2) ELSE 0 END AS taxa_agendamento,
  CASE WHEN SUM(agendamentos)>0 THEN ROUND(100.0*SUM(reunioes_realizadas)::numeric/SUM(agendamentos),2) ELSE 0 END AS show_rate,
  CASE WHEN SUM(negociacoes)>0 THEN ROUND(100.0*SUM(fechamentos)::numeric/SUM(negociacoes),2) ELSE 0 END AS win_rate
FROM public.daily_entries GROUP BY 1;
GRANT SELECT ON public.v_weekly_rollup TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_monthly_rollup AS
SELECT
  date_part('year', data)::int AS ano,
  date_part('month', data)::int AS mes,
  SUM(tentativas)::bigint AS tentativas,
  SUM(conexoes)::bigint AS conexoes,
  SUM(agendamentos)::bigint AS agendamentos,
  SUM(reunioes_realizadas)::bigint AS reunioes,
  SUM(fechamentos)::bigint AS fechamentos,
  SUM(receita)::numeric AS receita,
  CASE WHEN SUM(fechamentos)>0 THEN ROUND(SUM(receita)/SUM(fechamentos),2) ELSE 0 END AS ticket_medio
FROM public.daily_entries GROUP BY 1,2;
GRANT SELECT ON public.v_monthly_rollup TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_sdr_scoreboard AS
SELECT
  s.id AS sdr_id, s.nome, s.ativo,
  s.meta_ligacoes, s.meta_conexoes, s.meta_reunioes,
  COALESCE(SUM(d.tentativas),0)::bigint AS tentativas,
  COALESCE(SUM(d.conexoes),0)::bigint AS conexoes,
  COALESCE(SUM(d.agendamentos),0)::bigint AS agendamentos,
  COALESCE(SUM(d.reunioes_realizadas),0)::bigint AS reunioes,
  COALESCE(AVG(d.sla_medio_horas),0)::numeric(6,2) AS sla_medio,
  COALESCE(SUM(d.leads_parados),0)::bigint AS leads_parados,
  CASE WHEN SUM(d.tentativas)>0 THEN ROUND(100.0*SUM(d.conexoes)::numeric/SUM(d.tentativas),2) ELSE 0 END AS taxa_conexao,
  CASE WHEN SUM(d.conexoes)>0 THEN ROUND(100.0*SUM(d.agendamentos)::numeric/SUM(d.conexoes),2) ELSE 0 END AS taxa_agendamento
FROM public.sdrs s
LEFT JOIN public.daily_entries d ON d.sdr_id = s.id
GROUP BY s.id;
GRANT SELECT ON public.v_sdr_scoreboard TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_closer_scoreboard AS
SELECT
  c.id AS closer_id, c.nome, c.ativo,
  c.meta_reunioes, c.meta_fechamentos, c.meta_receita,
  COALESCE(SUM(d.reunioes_realizadas),0)::bigint AS reunioes,
  COALESCE(SUM(d.no_show),0)::bigint AS no_show,
  COALESCE(SUM(d.propostas),0)::bigint AS propostas,
  COALESCE(SUM(d.negociacoes),0)::bigint AS negociacoes,
  COALESCE(SUM(d.fechamentos),0)::bigint AS fechamentos,
  COALESCE(SUM(d.receita),0)::numeric AS receita,
  CASE WHEN (SUM(d.reunioes_realizadas)+SUM(d.no_show))>0
    THEN ROUND(100.0*SUM(d.reunioes_realizadas)::numeric/(SUM(d.reunioes_realizadas)+SUM(d.no_show)),2) ELSE 0 END AS show_rate,
  CASE WHEN SUM(d.negociacoes)>0 THEN ROUND(100.0*SUM(d.fechamentos)::numeric/SUM(d.negociacoes),2) ELSE 0 END AS win_rate,
  CASE WHEN SUM(d.fechamentos)>0 THEN ROUND(SUM(d.receita)/SUM(d.fechamentos),2) ELSE 0 END AS ticket_medio
FROM public.closers c
LEFT JOIN public.daily_entries d ON d.closer_id = c.id
GROUP BY c.id;
GRANT SELECT ON public.v_closer_scoreboard TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_forecast_month AS
SELECT
  mt.ano, mt.mes, mt.meta_receita, mt.contratos_necessarios, mt.ticket_alvo, mt.dias_uteis,
  COALESCE(mr.receita,0) AS receita_realizada,
  COALESCE(mr.fechamentos,0) AS fechamentos_realizados,
  GREATEST(mt.meta_receita - COALESCE(mr.receita,0), 0) AS gap,
  GREATEST(mt.contratos_necessarios - COALESCE(mr.fechamentos,0), 0) AS contratos_restantes,
  (SELECT COALESCE(SUM(amount * probability/100.0), 0)
   FROM public.opportunities o
   WHERE o.stage NOT IN ('Fechado-Ganho','Fechado-Perdido')) AS pipeline_ponderado
FROM public.monthly_targets mt
LEFT JOIN public.v_monthly_rollup mr ON mr.ano = mt.ano AND mr.mes = mt.mes;
GRANT SELECT ON public.v_forecast_month TO authenticated, service_role;

-- ===== SEED inicial =====
INSERT INTO public.thresholds (id) VALUES (1) ON CONFLICT DO NOTHING;

INSERT INTO public.origins (nome) VALUES ('Inbound'),('Outbound'),('Indicação'),('Parceria'),('Evento')
ON CONFLICT DO NOTHING;

INSERT INTO public.products (nome, ticket_base) VALUES
  ('Holding Patrimonial', 25000),
  ('Planejamento Sucessório', 18000),
  ('Estruturação Familiar', 15000)
ON CONFLICT DO NOTHING;

INSERT INTO public.monthly_targets (ano, mes, meta_receita, contratos_necessarios, ticket_alvo, dias_uteis) VALUES
  (2026, 6, 650000, 33, 20000, 21),
  (2026, 7, 700000, 35, 20000, 23),
  (2026, 8, 720000, 36, 20000, 21),
  (2026, 9, 750000, 37, 20000, 22),
  (2026,10, 780000, 39, 20000, 22),
  (2026,11, 800000, 40, 20000, 20),
  (2026,12, 820000, 41, 20000, 21)
ON CONFLICT (ano,mes) DO NOTHING;

INSERT INTO public.sprints (nome, data_inicio, data_fim, meta_receita, ordem) VALUES
  ('Sprint 1', '2026-06-02', '2026-06-08', 160000, 1),
  ('Sprint 2', '2026-06-09', '2026-06-15', 160000, 2),
  ('Sprint 3', '2026-06-16', '2026-06-22', 165000, 3),
  ('Sprint 4', '2026-06-23', '2026-06-30', 165000, 4)
ON CONFLICT DO NOTHING;
