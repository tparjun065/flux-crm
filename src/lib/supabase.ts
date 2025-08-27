import { supabase } from "@/integrations/supabase/client";

export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  project_name: string;
  client_id: string;
  budget: number;
  deadline?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  clients?: Partial<Client>;
};

export type Invoice = {
  id: string;
  invoice_no: string;
  client_id: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
  clients?: Partial<Client>;
  invoice_items?: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
};

// Clients API
export const clientsApi = {
  getAll: () => supabase.from('clients').select('*').order('created_at', { ascending: false }),
  getById: (id: string) => supabase.from('clients').select('*').eq('id', id).single(),
  create: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => 
    supabase.from('clients').insert([client]).select().single(),
  update: (id: string, client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) =>
    supabase.from('clients').update(client).eq('id', id).select().single(),
  delete: (id: string) => supabase.from('clients').delete().eq('id', id)
};

// Projects API
export const projectsApi = {
  getAll: () => supabase.from('projects').select(`
    *,
    clients (
      id,
      name,
      email,
      company
    )
  `).order('created_at', { ascending: false }),
  getById: (id: string) => supabase.from('projects').select(`
    *,
    clients (
      id,
      name,
      email,
      company
    )
  `).eq('id', id).single(),
  create: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
    supabase.from('projects').insert([project]).select(`
      *,
      clients (
        id,
        name,
        email,
        company
      )
    `).single(),
  update: (id: string, project: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>) =>
    supabase.from('projects').update(project).eq('id', id).select(`
      *,
      clients (
        id,
        name,
        email,
        company
      )
    `).single(),
  delete: (id: string) => supabase.from('projects').delete().eq('id', id)
};

// Invoices API
export const invoicesApi = {
  getAll: () => supabase.from('invoices').select(`
    *,
    clients (
      id,
      name,
      email,
      company
    ),
    invoice_items (*)
  `).order('created_at', { ascending: false }),
  getById: (id: string) => supabase.from('invoices').select(`
    *,
    clients (
      id,
      name,
      email,
      company
    ),
    invoice_items (*)
  `).eq('id', id).single(),
  create: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) =>
    supabase.from('invoices').insert([invoice]).select(`
      *,
      clients (
        id,
        name,
        email,
        company
      ),
      invoice_items (*)
    `).single(),
  update: (id: string, invoice: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>) =>
    supabase.from('invoices').update(invoice).eq('id', id).select(`
      *,
      clients (
        id,
        name,
        email,
        company
      ),
      invoice_items (*)
    `).single(),
  delete: (id: string) => supabase.from('invoices').delete().eq('id', id)
};

// Invoice Items API
export const invoiceItemsApi = {
  create: (item: Omit<InvoiceItem, 'id' | 'created_at'>) =>
    supabase.from('invoice_items').insert([item]).select().single(),
  updateBatch: async (invoiceId: string, items: Omit<InvoiceItem, 'id' | 'created_at' | 'invoice_id'>[]) => {
    // Delete existing items and create new ones
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    return supabase.from('invoice_items').insert(
      items.map(item => ({ ...item, invoice_id: invoiceId }))
    );
  },
  deleteByInvoice: (invoiceId: string) =>
    supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
};

// Dashboard Stats
export const getDashboardStats = async () => {
  const [clientsCountRes, projectsRes, invoicesRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id, budget'),
    supabase.from('invoices').select('total'),
  ]);

  const clients_count = clientsCountRes.count ?? 0;
  const projects_count = projectsRes.data?.length ?? 0;
  const expected_revenue = (projectsRes.data || []).reduce(
    (sum: number, p: any) => sum + (Number(p.budget) || 0),
    0
  );
  const total_revenue = (invoicesRes.data || []).reduce(
    (sum: number, i: any) => sum + (Number(i.total) || 0),
    0
  );

  return { clients_count, projects_count, total_revenue, expected_revenue };
};