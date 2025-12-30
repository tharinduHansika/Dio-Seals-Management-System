module.exports = {
  ROLES: {
    ADMIN: 'Admin',
    DIRECTOR: 'Director',
    MARKETING_MANAGER: 'Marketing Manager',
    STORE_KEEPER: 'Store Keeper',
    PRINTING_OPERATOR: 'Printing Operator',
    CASHIER: 'Cashier',
    ACCOUNTANT: 'Accountant',
  },

  ORDER_STATUS: {
    CREATED: 'created',
    WAITING_PRINT: 'waiting_print',
    IN_PROGRESS: 'in_progress',
    JOB_DONE: 'job_done',
    INVOICED: 'invoiced',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  PAYMENT_STATUS: {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    OVERDUE: 'overdue',
  },

  INVOICE_TYPE: {
    NORMAL: 'normal',
    TAX: 'tax',
  },

  PRINTING_TYPE: {
    NORMAL_SERIAL: 'normal_serial',
    BARCODE: 'barcode',
    QR_CODE: 'qr_code',
  },

  SERIAL_STATUS: {
    ASSIGNED: 'assigned',
    PRINTED: 'printed',
    SOLD: 'sold',
    DAMAGED: 'damaged',
  },

  JOB_STATUS: {
    NEW: 'new',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
  },

  PAYMENT_METHOD: {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    CHEQUE: 'cheque',
    CARD: 'card',
  },

  EXPENSE_CATEGORY: {
    FUEL: 'fuel',
    ELECTRICITY: 'electricity',
    SALARY: 'salary',
    PURCHASE: 'purchase',
    CREDIT: 'credit',
    PETTY_CASH: 'petty_cash',
    OTHER: 'other',
  },

  ASSET_STATUS: {
    ACTIVE: 'active',
    DISPOSED: 'disposed',
    UNDER_REPAIR: 'under_repair',
  },

  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};