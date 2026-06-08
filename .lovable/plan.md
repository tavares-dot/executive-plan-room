
# Legacy Sales Ops Hub 2.0 — Plano de Reconstrução

Transformar a Central de Comando em uma **fonte única de verdade**: todo dado é digitado **uma única vez** no Controle Operacional Diário e propaga automaticamente para todos os módulos (cockpit, funil, semanal, mensal, SDR/Closer Ops, forecast, reuniões).

---

## 1. Nova Arquitetura

```text
┌─────────────────────────────────────────────────────────┐
│  ENTRADA ÚNICA (Operação Diária + Reuniões + Kanban)    │
└───────────────────────┬─────────────────────────────────┘
                        │ writes
                        ▼
        ┌───────────────────────────────┐
        │   LOVABLE CLOUD (Postgres)    │
        │   — fonte única de verdade —  │
        └───────────────┬───────────────┘
                        │ SQL views + server fns + React Query
        ┌───────────────┼────────────────────────────────┐
        ▼               ▼               ▼                ▼
   Cockpit         Funil          SDR/Closer        Forecast
   Semanal         Mensal         Reuniões          Relatórios
```

Princípios:
- **Zero digitação duplicada.** Todo número nasce em `daily_entries`, `meetings` ou `opportunities`.
- **Cálculos via SQL views** (taxa de conexão, show rate, win rate, gap, ritmo necessário, pipeline ponderado).
- **React Query** com `invalidateQueries` em cada mutation → todas as telas atualizam em tempo real.
- **LocalStorage vira cache de UI** (filtros, preferências). Dados reais sempre vêm do banco.

---

## 2. Modelo de Banco (Lovable Cloud)

### Tabelas core
- `profiles` — id (auth.users), nome, email, avatar
- `user_roles` — (user_id, role): admin | head | gestor | sdr | closer | viewer
- `sdrs` — id, profile_id, nome, ativo, metas (json)
- `closers` — id, profile_id, nome, ativo, metas (json)
- `products` — id, nome, ticket_base
- `origins` — id, nome (Inbound, Outbound, Indicação...)
- `sprints` — id, nome, data_inicio, data_fim, meta_receita

### Tabelas operacionais (entrada única)
- `daily_entries` — **núcleo do sistema**
  - id, data, sdr_id, closer_id, sprint_id
  - tentativas, conexoes, agendamentos, reunioes_realizadas, no_show
  - negociacoes, propostas, fechamentos, receita
  - observacoes, gargalos, aprendizados
  - created_by, updated_at
- `meetings` — id, data, empresa, contato, origin_id, closer_id, valor_estimado, status, realizada, proposta_enviada, negociacao, fechou, receita_gerada, product_id
- `opportunities` (pipeline/CRM) — id, lead_id, empresa, closer_id, stage, amount, probability, expected_close, next_step, days_in_stage, criticidade
- `leads`, `companies`, `contacts`, `activities` — estrutura CRM-ready
- `kanban_cards` — id, titulo, descricao, coluna, responsavel_id, prioridade, area, due_date, checklist (jsonb), comentarios (jsonb), anexos (jsonb)
- `monthly_targets` — mes, ano, meta_receita, contratos_necessarios, ticket_alvo
- `thresholds` — singleton de parâmetros (taxa_conexao_min, sla_max, etc.)
- `audit_log` — tabela, registro_id, acao, antes, depois, user_id, timestamp

### Views agregadas (cálculo automático)
- `v_daily_kpis` — por (data, sdr_id, closer_id) com taxas calculadas
- `v_weekly_rollup` — agrupa por semana ISO
- `v_monthly_rollup` — agrupa por mês
- `v_funnel` — soma etapas + taxas
- `v_sdr_scoreboard` — score operacional + qualitativo + semáforo
- `v_closer_scoreboard` — show rate, win rate, ticket médio, forecast individual
- `v_forecast` — commit + best + pipeline ponderado + gap + ritmo

### Relacionamentos
```text
profiles ──< user_roles
profiles ──< sdrs / closers
sdrs ──< daily_entries >── closers
closers ──< meetings >── origins / products
closers ──< opportunities >── leads ── companies ── contacts
sprints ──< daily_entries
monthly_targets (mes/ano) ←→ v_monthly_rollup
todas as views derivam de daily_entries + meetings + opportunities
```

### Segurança
- RLS em todas as tabelas
- `has_role(uid, role)` security definer
- Admin/Head: full access; Gestor: leitura geral + edição operacional; SDR/Closer: vê e edita só os próprios registros; Viewer: read-only

---

## 3. Mapa de Telas (rotas consolidadas)

| Rota | Módulo | Origem dos dados |
|---|---|---|
| `/` | Cockpit Executivo | `v_monthly_rollup`, `v_forecast` |
| `/operacao` | Controle Diário (entrada única) | `daily_entries` (CRUD) |
| `/semanal` | Controle Semanal | `v_weekly_rollup` |
| `/mensal` | Controle Mensal | `v_monthly_rollup` |
| `/funil` | Funil Comercial | `v_funnel` |
| `/sdrs` | SDR Ops (lista + drill) | `v_sdr_scoreboard` |
| `/sdrs/$id` | SDR individual | view filtrada |
| `/closers` | Closer Ops | `v_closer_scoreboard` |
| `/closers/$id` | Closer individual | view filtrada |
| `/forecast` | Forecast | `v_forecast` |
| `/reunioes` | Reuniões Closers | `meetings` (CRUD) |
| `/kanban` | Kanban Operacional | `kanban_cards` (CRUD) |
| `/crm` | Leads/Oportunidades | `opportunities`, `leads` |
| `/governanca` | Permissões/Usuários | `user_roles` (admin) |
| `/auth` | Login | Supabase Auth |

Rotas a **remover/migrar**: `s1–s4`, `cockpit` (vira `/`), `meta-junho`, `checkpoint`, `fechamento-dia`, `receita`, `indicadores`, `rituais`, `riscos`, `acoes`, `calendario`, `war-room` — conteúdo absorvido por cockpit/operação/kanban.

---

## 4. Roadmap de Implementação

**Fase 1 — Fundação (entregue nesta sessão)**
1. Habilitar Lovable Cloud
2. Migrations: todas as tabelas + RLS + grants + has_role
3. Migrations: views agregadas (KPIs, rollups, funil, scoreboards, forecast)
4. Seed mínimo (SDRs, Closers, sprints, thresholds, monthly_targets Jun–Dez)
5. Auth (`/auth`) + layout `_authenticated` + governança básica

**Fase 2 — Camada de dados no front**
6. `src/lib/api/*.functions.ts` — server fns para cada view e mutation
7. `src/lib/queries.ts` — queryOptions centralizados
8. Aposentar `plan-store` como fonte; manter só preferências UI

**Fase 3 — Telas core (entrada → consumo)**
9. `/operacao` — tabela editável diária (entrada única)
10. `/` Cockpit + `/semanal` + `/mensal` + `/funil` + `/forecast`
11. `/sdrs` + `/closers` (lista + drill individual)
12. `/reunioes` (CRUD completo)

**Fase 4 — Operacional avançado**
13. `/kanban` (drag-and-drop, checklist, comentários)
14. `/crm` (leads, oportunidades, pipeline visual)
15. Auditoria + histórico

**Fase 5 — Integrações**
16. Conectores 3C Plus / RD / HubSpot / Pipedrive (server routes `/api/public/webhooks/*`)
17. Exportação relatórios (PDF/CSV)

---

## 5. Escopo desta primeira entrega

Dado o tamanho, proponho executar **Fase 1 + Fase 2 + Fase 3 (parcial: `/operacao`, `/` cockpit, `/funil`, `/forecast`)** nesta rodada. Demais telas serão migradas em rodadas seguintes, **mantendo as telas atuais funcionando como fallback** até a migração ser concluída (sem quebrar nada).

---

## Confirmações antes de executar

1. **Posso habilitar Lovable Cloud agora?** (cria projeto Supabase gerenciado, ativa Auth)
2. **Auth obrigatório desde já?** Você pediu antes para "deixar o sistema aberto". Sales Ops Hub 2.0 exige login para governança/RLS — confirmo reativar `/auth` + `_authenticated`?
3. **Migrar dados atuais do `plan-store` (localStorage) para o banco como seed inicial?** (sim recomendado, para não perder o que já foi digitado)
4. **Posso aposentar as rotas listadas acima (s1–s4, war-room, etc.) ou prefere mantê-las como legacy oculto no menu?**

Responda essas 4 e eu inicio a Fase 1 imediatamente.
