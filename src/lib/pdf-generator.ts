import jsPDF from 'jspdf';
import { type Invoice } from './supabase';
import { BRAND_NAME, BRAND_LOGO } from './brand';

export const generateInvoicePDF = async (invoice: Invoice) => {
  const pdf = new jsPDF();
  
  // Modern glassmorphism background
  pdf.setFillColor(15, 15, 35); // Dark background
  pdf.rect(0, 0, 210, 297, 'F');
  
  // Glassmorphism header card
  pdf.setFillColor(30, 30, 50, 0.8); // Semi-transparent
  pdf.roundedRect(15, 15, 180, 50, 8, 8, 'F');
  
  // Gradient border effect (simulated with multiple rectangles)
  pdf.setDrawColor(138, 92, 246); // Primary purple
  pdf.setLineWidth(0.5);
  pdf.roundedRect(15, 15, 180, 50, 8, 8, 'S');
  
  // Large brand name - futuristic typography
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text(BRAND_NAME, 105, 35, { align: 'center' });
  
  // Neon accent line
  pdf.setDrawColor(64, 224, 208); // Cyan accent
  pdf.setLineWidth(2);
  pdf.line(25, 45, 185, 45);
  
  // Invoice title card
  pdf.setFillColor(138, 92, 246, 0.2); // Primary color background
  pdf.roundedRect(120, 75, 70, 25, 5, 5, 'F');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('INVOICE', 155, 92, { align: 'center' });
  
  // Invoice Details card
  pdf.setFillColor(25, 25, 40, 0.6);
  pdf.roundedRect(120, 105, 70, 35, 5, 5, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  pdf.text(`Invoice #: ${invoice.invoice_no}`, 125, 115);
  pdf.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 125, 125);
  pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 125, 135);
  
  // Client Information card
  pdf.setFillColor(25, 25, 40, 0.6);
  pdf.roundedRect(15, 75, 100, 65, 5, 5, 'F');
  pdf.setFontSize(14);
  pdf.setTextColor(64, 224, 208); // Cyan accent
  pdf.text('Bill To:', 20, 90);
  
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  if (invoice.clients) {
    pdf.text(invoice.clients.name, 20, 105);
    if (invoice.clients.company) {
      pdf.text(invoice.clients.company, 20, 115);
    }
    pdf.text(invoice.clients.email, 20, 125);
    if (invoice.clients.phone) {
      pdf.text(invoice.clients.phone, 20, 135);
    }
  }
  
  // Items table with glassmorphism
  pdf.setFillColor(138, 92, 246, 0.1);
  pdf.roundedRect(15, 155, 180, 15, 5, 5, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(64, 224, 208); // Cyan headers
  pdf.text('Description', 20, 165);
  pdf.text('Qty', 120, 165);
  pdf.text('Price (₹)', 140, 165);
  pdf.text('Total (₹)', 165, 165);
  
  // Table Content with alternating row colors
  let yPosition = 180;
  pdf.setTextColor(255, 255, 255);
  if (invoice.invoice_items) {
    invoice.invoice_items.forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        pdf.setFillColor(25, 25, 40, 0.3);
        pdf.rect(15, yPosition - 5, 180, 10, 'F');
      }
      
      pdf.text(item.description, 20, yPosition);
      pdf.text(item.quantity.toString(), 125, yPosition);
      pdf.text(`₹${item.price.toFixed(2)}`, 145, yPosition);
      pdf.text(`₹${item.total.toFixed(2)}`, 170, yPosition);
      yPosition += 12;
    });
  }
  
  // Totals section with glassmorphism card
  yPosition += 15;
  pdf.setFillColor(25, 25, 40, 0.8);
  pdf.roundedRect(120, yPosition - 5, 75, 40, 5, 5, 'F');
  
  pdf.setDrawColor(64, 224, 208);
  pdf.setLineWidth(1);
  pdf.line(125, yPosition + 5, 190, yPosition + 5);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setTextColor(200, 200, 200);
  pdf.text('Subtotal:', 125, yPosition);
  pdf.text(`₹${invoice.subtotal.toFixed(2)}`, 175, yPosition);
  
  yPosition += 8;
  pdf.text(`Tax (${invoice.tax_rate}%):`, 125, yPosition);
  pdf.text(`₹${invoice.tax_amount.toFixed(2)}`, 175, yPosition);
  
  yPosition += 12;
  pdf.setFontSize(16);
  pdf.setTextColor(64, 224, 208); // Cyan for total
  pdf.setFont(undefined, 'bold');
  pdf.text('Total:', 125, yPosition);
  pdf.text(`₹${invoice.total.toFixed(2)}`, 175, yPosition);
  
  // Footer with glassmorphism
  pdf.setFillColor(25, 25, 40, 0.6);
  pdf.roundedRect(15, 250, 180, 30, 5, 5, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(64, 224, 208);
  pdf.text('Thank you for your business!', 105, 265, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  pdf.text('Payment terms: Net 30 days', 105, 275, { align: 'center' });
  
  // Save the PDF
  pdf.save(`Invoice-${invoice.invoice_no}.pdf`);
};