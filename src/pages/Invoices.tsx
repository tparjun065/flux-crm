import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { invoicesApi, invoiceItemsApi, clientsApi, type Invoice, type Client, type InvoiceItem } from "@/lib/supabase";
import { generateInvoicePDF } from "@/lib/pdf-generator";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    invoice_no: "",
    client_id: "",
    date: new Date().toISOString().split('T')[0],
    due_date: "",
    tax_rate: "10",
    items: [{ description: "", quantity: 1, price: 0 }] as Array<{description: string, quantity: number, price: number}>
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.clients?.company || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm]);

  const loadData = async () => {
    try {
      const [invoicesResult, clientsResult] = await Promise.all([
        invoicesApi.getAll(),
        clientsApi.getAll()
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setInvoices(invoicesResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateInvoiceTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxRate = parseFloat(formData.tax_rate) / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { subtotal, taxAmount, total } = calculateInvoiceTotals();
      
      const invoiceData = {
        invoice_no: formData.invoice_no,
        client_id: formData.client_id,
        date: formData.date,
        due_date: formData.due_date,
        subtotal,
        tax_rate: parseFloat(formData.tax_rate),
        tax_amount: taxAmount,
        total
      };

      if (selectedInvoice) {
        const { data, error } = await invoicesApi.update(selectedInvoice.id, invoiceData);
        if (error) throw error;
        
        // Update invoice items
        await invoiceItemsApi.deleteByInvoice(selectedInvoice.id);
        for (const item of formData.items) {
          await invoiceItemsApi.create({
            invoice_id: selectedInvoice.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          });
        }
        
        setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? data : inv));
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        const { data, error } = await invoicesApi.create(invoiceData);
        if (error) throw error;
        
        // Create invoice items
        for (const item of formData.items) {
          await invoiceItemsApi.create({
            invoice_id: data.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          });
        }
        
        setInvoices([data, ...invoices]);
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData(); // Reload to get updated invoice items
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const { error } = await invoicesApi.delete(id);
      if (error) throw error;
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice);
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_no: `INV-${Date.now()}`,
      client_id: "",
      date: new Date().toISOString().split('T')[0],
      due_date: "",
      tax_rate: "10",
      items: [{ description: "", quantity: 1, price: 0 }]
    });
    setSelectedInvoice(null);
    setIsViewMode(false);
  };

  const openDialog = (invoice?: Invoice, viewMode = false) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        invoice_no: invoice.invoice_no,
        client_id: invoice.client_id,
        date: invoice.date,
        due_date: invoice.due_date,
        tax_rate: invoice.tax_rate.toString(),
        items: invoice.invoice_items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price
        })) || [{ description: "", quantity: 1, price: 0 }]
      });
    } else {
      resetForm();
    }
    setIsViewMode(viewMode);
    setIsDialogOpen(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: newItems });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const { subtotal, taxAmount, total } = calculateInvoiceTotals();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage your invoices
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="neon-glow w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? "Invoice Details" : selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_no">Invoice Number *</Label>
                  <Input
                    id="invoice_no"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    required
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="client_id">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Invoice Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
              </div>

              <Separator className="border-white/10" />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Invoice Items</h3>
                  {!isViewMode && (
                    <Button type="button" onClick={addItem} size="sm">
                      Add Item
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        disabled={isViewMode}
                        className="flex-1 glass border-white/10"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        disabled={isViewMode}
                        className="w-20 glass border-white/10"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        disabled={isViewMode}
                        className="w-32 glass border-white/10"
                      />
                      <div className="w-32 text-right font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </div>
                      {!isViewMode && formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="w-8 h-8 p-0"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="border-white/10" />

              <div className="flex justify-between items-start">
                <div>
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    disabled={isViewMode}
                    className="w-32 glass border-white/10"
                  />
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex justify-between w-64">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax_rate}%):</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <Separator className="border-white/10" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {!isViewMode && (
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="neon-glow">
                    {loading ? "Saving..." : selectedInvoice ? "Update" : "Create"}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 glass border-white/10"
        />
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const isOverdue = new Date(invoice.due_date) < new Date();
                    return (
                      <TableRow key={invoice.id} className="border-white/10">
                        <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.clients?.name}</div>
                            {invoice.clients?.company && (
                              <div className="text-sm text-muted-foreground">{invoice.clients.company}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>
                          <Badge className={isOverdue ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                            {isOverdue ? "Overdue" : "Current"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(invoice, true)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(invoice)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(invoice)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(invoice.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}