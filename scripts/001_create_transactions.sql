-- Tabela de transações para fluxo de caixa
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado')),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas por data
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- Habilitar RLS (Row Level Security) - desabilitado por padrão para simplicidade
-- Se você quiser adicionar autenticação depois, habilite RLS e adicione políticas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (sem autenticação)
-- Em produção, você deve adicionar user_id e políticas mais restritivas
CREATE POLICY "Allow all operations" ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
