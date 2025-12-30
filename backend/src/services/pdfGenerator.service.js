const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class PDFGeneratorService {
  // Generate Invoice PDF
  static async generateInvoice(invoiceData) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('DIO SEALS (PVT) LTD', { align: 'center' });
        doc.fontSize(10).text('Security Seal Distribution', { align: 'center' });
        doc.fontSize(10).text('123 Main Street, Colombo, Sri Lanka', { align: 'center' });
        doc.fontSize(10).text('Tel: +94 11 234 5678 | Email: info@dioseals.lk', { align: 'center' });
        doc.moveDown();

        // Invoice Title
        if (invoiceData.invoice_type === 'tax') {
          doc.fontSize(16).text('TAX INVOICE', { align: 'center', underline: true });
        } else {
          doc.fontSize(16).text('INVOICE', { align: 'center', underline: true });
        }
        doc.moveDown();

        // Invoice Details
        doc.fontSize(10);
        doc.text(`Invoice Number: ${invoiceData.invoice_number}`, 50, 200);
        doc.text(`Invoice Date: ${new Date(invoiceData.invoice_date).toLocaleDateString()}`, 50, 215);
        doc.text(`Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}`, 50, 230);
        doc.text(`Order Number: ${invoiceData.order_number}`, 50, 245);

        // Customer Details
        doc.text(`Bill To:`, 350, 200);
        doc.text(invoiceData.company_name, 350, 215);
        if (invoiceData.address) doc.text(invoiceData.address, 350, 230);
        if (invoiceData.phone) doc.text(`Phone: ${invoiceData.phone}`, 350, 245);
        if (invoiceData.email) doc.text(`Email: ${invoiceData.email}`, 350, 260);

        doc.moveDown(4);

        // Table Header
        const tableTop = 300;
        doc.fontSize(10).text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop);
        doc.text('Unit Price', 350, tableTop);
        doc.text('Total', 450, tableTop);
        
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        // Table Items
        let yPosition = tableTop + 25;
        invoiceData.items.forEach((item, index) => {
          doc.text(item.product_name, 50, yPosition);
          doc.text(item.quantity.toString(), 250, yPosition);
          doc.text(`Rs. ${parseFloat(item.unit_price).toFixed(2)}`, 350, yPosition);
          doc.text(`Rs. ${parseFloat(item.total_price).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Totals
        yPosition += 20;
        doc.moveTo(50, yPosition)
           .lineTo(550, yPosition)
           .stroke();
        
        yPosition += 15;
        doc.text('Subtotal:', 350, yPosition);
        doc.text(`Rs. ${parseFloat(invoiceData.subtotal).toFixed(2)}`, 450, yPosition);
        
        if (invoiceData.invoice_type === 'tax' && invoiceData.tax_amount > 0) {
          yPosition += 20;
          doc.text('Tax (VAT):', 350, yPosition);
          doc.text(`Rs. ${parseFloat(invoiceData.tax_amount).toFixed(2)}`, 450, yPosition);
        }

        yPosition += 20;
        doc.fontSize(12).text('Total:', 350, yPosition);
        doc.text(`Rs. ${parseFloat(invoiceData.total_amount).toFixed(2)}`, 450, yPosition);

        // Footer
        doc.fontSize(8).text('Thank you for your business!', 50, 700, { align: 'center' });
        doc.text('This is a computer-generated invoice and does not require a signature.', 50, 715, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Receipt PDF
  static async generateReceipt(receiptData) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('DIO SEALS (PVT) LTD', { align: 'center' });
        doc.fontSize(10).text('Security Seal Distribution', { align: 'center' });
        doc.fontSize(10).text('123 Main Street, Colombo, Sri Lanka', { align: 'center' });
        doc.moveDown();

        // Receipt Title
        doc.fontSize(16).text('PAYMENT RECEIPT', { align: 'center', underline: true });
        doc.moveDown();

        // Receipt Details
        doc.fontSize(10);
        doc.text(`Receipt Number: ${receiptData.receipt_number}`, 50, 180);
        doc.text(`Receipt Date: ${new Date(receiptData.receipt_date).toLocaleDateString()}`, 50, 195);
        doc.text(`Payment Date: ${new Date(receiptData.payment_date).toLocaleDateString()}`, 50, 210);
        doc.text(`Payment Method: ${receiptData.payment_method.toUpperCase()}`, 50, 225);

        // Customer Details
        doc.text(`Received From:`, 350, 180);
        doc.text(receiptData.company_name, 350, 195);
        if (receiptData.address) doc.text(receiptData.address, 350, 210);
        if (receiptData.phone) doc.text(`Phone: ${receiptData.phone}`, 350, 225);

        doc.moveDown(3);

        // Payment Details Box
        const boxTop = 280;
        doc.rect(50, boxTop, 500, 100).stroke();
        
        doc.fontSize(12).text('Payment Details', 60, boxTop + 10);
        doc.fontSize(10);
        doc.text(`Invoice Number: ${receiptData.invoice_number}`, 60, boxTop + 35);
        doc.text(`Order Number: ${receiptData.order_number}`, 60, boxTop + 50);
        doc.text(`Payment Number: ${receiptData.payment_number}`, 60, boxTop + 65);

        // Amount Box
        const amountBoxTop = 400;
        doc.rect(50, amountBoxTop, 500, 80).stroke();
        doc.fontSize(14).text('Amount Paid', 60, amountBoxTop + 15);
        doc.fontSize(20).text(`Rs. ${parseFloat(receiptData.amount).toFixed(2)}`, 350, amountBoxTop + 30, { align: 'right' });

        // Generate QR Code for receipt verification
        const qrData = `RECEIPT:${receiptData.receipt_number}:${receiptData.amount}`;
        const qrImage = await QRCode.toDataURL(qrData);
        const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
        doc.image(qrBuffer, 450, 520, { width: 100 });

        // Footer
        doc.fontSize(10).text(`Issued By: ${receiptData.issued_by_name}`, 50, 650);
        doc.fontSize(8).text('This is a computer-generated receipt and does not require a signature.', 50, 700, { align: 'center' });
        doc.text('Scan QR code to verify receipt authenticity.', 50, 715, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Quotation PDF
  static async generateQuotation(quotationData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(20).text('DIO SEALS (PVT) LTD', { align: 'center' });
        doc.fontSize(10).text('Security Seal Distribution', { align: 'center' });
        doc.moveDown();

        // Quotation Title
        doc.fontSize(16).text('QUOTATION', { align: 'center', underline: true });
        doc.moveDown();

        // Quotation Details
        doc.fontSize(10);
        doc.text(`Quotation Number: ${quotationData.quotation_number}`, 50, 180);
        doc.text(`Date: ${new Date(quotationData.quotation_date).toLocaleDateString()}`, 50, 195);
        doc.text(`Valid Until: ${new Date(quotationData.valid_until).toLocaleDateString()}`, 50, 210);

        // Customer Details
        doc.text(`Prepared For:`, 350, 180);
        doc.text(quotationData.company_name, 350, 195);

        doc.moveDown(3);

        // Table
        const tableTop = 280;
        doc.fontSize(10).text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop);
        doc.text('Unit Price', 350, tableTop);
        doc.text('Total', 450, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let yPosition = tableTop + 25;
        quotationData.items.forEach((item) => {
          doc.text(item.product_name, 50, yPosition);
          doc.text(item.quantity.toString(), 250, yPosition);
          doc.text(`Rs. ${parseFloat(item.unit_price).toFixed(2)}`, 350, yPosition);
          doc.text(`Rs. ${parseFloat(item.total_price).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Total
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;
        doc.fontSize(12).text('Total:', 350, yPosition);
        doc.text(`Rs. ${parseFloat(quotationData.total_amount).toFixed(2)}`, 450, yPosition);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGeneratorService;