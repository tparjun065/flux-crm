import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { clientsApi, type Client } from "@/lib/supabase";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const { toast } = useToast();

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await clientsApi.getAll();
    if (error) {
      toast({ title: "Error", description: "Failed to load clients", variant: "destructive" });
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, company: form.company.trim() || undefined } as any;
    const { error } = await clientsApi.create(payload);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client added" });
      setForm({ name: "", email: "", phone: "", company: "" });
      loadClients();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Clients</h1>
        <p className="text-muted-foreground mt-2">Manage your clients</p>
      </header>

      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle>Add Client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Client"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company || "-"}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.phone || "-"}</TableCell>
                </TableRow>
              ))}
              {!clients.length && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No clients yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
