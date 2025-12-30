const db = require('../config/database');
const PDFDocument = require('pdfkit');

class ReportGeneratorService {
  // Generate Sales Report PDF
  static async generateSalesReportPDF(reportData) {
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
        doc.fontSize(18).text('DIO SEALS - SALES REPORT', { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Summary
        doc.fontSize(12).text('Summary', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Orders: ${reportData.summary.total_orders}`);
        doc.text(`Total Sales: Rs. ${parseFloat(reportData.summary.total_sales).toFixed(2)}`);
        doc.text(`Average Order Value: Rs. ${parseFloat(reportData.summary.average_order_value).toFixed(2)}`);
        doc.moveDown();

        // Orders Table
        doc.fontSize(12).text('Orders', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(9);
        doc.text('Order No', 50, tableTop);
        doc.text('Date', 150, tableTop);
        doc.text('Customer', 250, tableTop);
        doc.text('Amount', 450, tableTop);
        doc.text('Status', 500, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let yPosition = tableTop + 20;
        reportData.orders.slice(0, 20).forEach((order) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.text(order.order_number, 50, yPosition);
          doc.text(new Date(order.order_date).toLocaleDateString(), 150, yPosition);
          doc.text(order.company_name.substring(0, 15), 250, yPosition);
          doc.text(`Rs. ${parseFloat(order.total_amount).toFixed(2)}`, 450, yPosition);
          doc.text(order.order_status, 500, yPosition);
          yPosition += 15;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Stock Report PDF
  static async generateStockReportPDF(reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, landscape: true });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        doc.fontSize(18).text('DIO SEALS - STOCK REPORT', { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown();

        // Summary
        doc.fontSize(12).text('Summary', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Products: ${reportData.summary.total_products}`);
        doc.text(`Total Available Stock: ${reportData.summary.total_available}`);
        doc.text(`Total Stock Value: Rs. ${parseFloat(reportData.summary.total_stock_value).toFixed(2)}`);
        doc.moveDown();

        // Stock Table
        doc.fontSize(12).text('Stock Details', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(8);
        doc.text('Product', 50, tableTop);
        doc.text('Available', 200, tableTop);
        doc.text('Reserved', 270, tableTop);
        doc.text('Sold', 340, tableTop);
        doc.text('Damaged', 410, tableTop);
        doc.text('Min Threshold', 480, tableTop);
        doc.text('Value', 570, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(650, tableTop + 15).stroke();

        let yPosition = tableTop + 20;
        reportData.products.forEach((product) => {
          if (yPosition > 500) {
            doc.addPage();
            yPosition = 50;
          }

          doc.text(product.product_name.substring(0, 20), 50, yPosition);
          doc.text(product.available_qty.toString(), 200, yPosition);
          doc.text(product.reserved_qty.toString(), 270, yPosition);
          doc.text(product.sold_qty.toString(), 340, yPosition);
          doc.text(product.damaged_qty.toString(), 410, yPosition);
          doc.text(product.minimum_threshold.toString(), 480, yPosition);
          doc.text(`Rs. ${parseFloat(product.stock_value).toFixed(2)}`, 570, yPosition);
          yPosition += 15;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Export Report to CSV
  static generateCSV(data, headers) {
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      csv += headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, '_')];
        return `"${value || ''}"`;
      }).join(',') + '\n';
    });

    return csv;
  }

  // Export Report to Excel format (CSV)
  static async exportToExcel(reportType, data) {
    const headers = {
      sales: ['Order Number', 'Date', 'Customer', 'Amount', 'Status'],
      stock: ['Product', 'Available', 'Reserved', 'Sold', 'Damaged', 'Value'],
      payments: ['Payment Number', 'Date', 'Customer', 'Amount', 'Method']
    };

    return this.generateCSV(data, headers[reportType] || []);
  }
}

module.exports = ReportGeneratorService;