import jsPDF from 'jspdf';
import { type Invoice } from './supabase';
import { BRAND_NAME, BRAND_LOGO } from './brand';

export const generateInvoicePDF = async (invoice: Invoice) => {
  const pdf = new jsPDF();
  
  // Company Header
  // Try to render the logo if available
  try {
    const res = await fetch(BRAND_LOGO);
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    pdf.addImage(dataUrl, 'PNG', 20, 18, 24, 24);
  } catch (_) {
    // ignore logo load errors
  }

  pdf.setFontSize(24);
  pdf.setTextColor(138, 92, 246); // Purple color
  pdf.text(BRAND_NAME, 50, 30);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  // You can customize these company details in src/lib/brand.ts if needed
  // pdf.text('Tagline or description', 50, 38);

  // Invoice Title
  pdf.setFontSize(28);
  pdf.setTextColor(0, 0, 0);
  pdf.text('INVOICE', 140, 30);
  
  // Invoice Details
  pdf.setFontSize(12);
  pdf.text(`Invoice #: ${invoice.invoice_no}`, 140, 45);
  pdf.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 140, 55);
  pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 140, 65);
  
  // Client Information
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Bill To:', 20, 80);
  
  pdf.setFontSize(12);
  if (invoice.clients) {
    pdf.text(invoice.clients.name, 20, 90);
    if (invoice.clients.company) {
      pdf.text(invoice.clients.company, 20, 100);
    }
    pdf.text(invoice.clients.email, 20, 110);
    if (invoice.clients.phone) {
      pdf.text(invoice.clients.phone, 20, 120);
    }
  }
  
  // Line separator
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 140, 190, 140);
  
  // Table Header
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, 150, 170, 10, 'F');
  
  pdf.text('Description', 25, 157);
  pdf.text('Qty', 120, 157);
  pdf.text('Price', 140, 157);
  pdf.text('Total', 165, 157);
  
  // Table Content
  let yPosition = 170;
  if (invoice.invoice_items) {
    invoice.invoice_items.forEach((item) => {
      pdf.text(item.description, 25, yPosition);
      pdf.text(item.quantity.toString(), 125, yPosition);
      pdf.text(`$${item.price.toFixed(2)}`, 145, yPosition);
      pdf.text(`$${item.total.toFixed(2)}`, 170, yPosition);
      yPosition += 10;
    });
  }
  
  // Totals
  yPosition += 10;
  pdf.setLineWidth(0.5);
  pdf.line(120, yPosition, 190, yPosition);
  
  yPosition += 15;
  pdf.text('Subtotal:', 140, yPosition);
  pdf.text(`$${invoice.subtotal.toFixed(2)}`, 170, yPosition);
  
  yPosition += 10;
  pdf.text(`Tax (${invoice.tax_rate}%):`, 140, yPosition);
  pdf.text(`$${invoice.tax_amount.toFixed(2)}`, 170, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Total:', 140, yPosition);
  pdf.text(`$${invoice.total.toFixed(2)}`, 170, yPosition);
  
  // Footer
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Thank you for your business!', 20, 250);
  pdf.text('Payment terms: Net 30 days', 20, 260);
  
  // Save the PDF
  pdf.save(`Invoice-${invoice.invoice_no}.pdf`);
};