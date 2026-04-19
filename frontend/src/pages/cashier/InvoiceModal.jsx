import { X, Printer, RotateCcw } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, order, onNewSale }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-invoice-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button — hidden when printing */}
        <button className="pos-invoice-close no-print" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Receipt Content */}
        <div className="pos-receipt" id="pos-receipt-content">
          <div className="pos-receipt-header">
            <h2 className="pos-receipt-store-name">
              {order.storeId?.name || 'FreshCart Store'}
            </h2>
            <p className="pos-receipt-store-info">
              {order.storeId?.address || ''}
            </p>
            {order.storeId?.phone && (
              <p className="pos-receipt-store-info">Tel: {order.storeId.phone}</p>
            )}
            <div className="pos-receipt-divider">{'─'.repeat(40)}</div>
            <p className="pos-receipt-title">SALE RECEIPT</p>
            <div className="pos-receipt-divider">{'─'.repeat(40)}</div>
          </div>

          <div className="pos-receipt-meta">
            <div className="pos-receipt-meta-row">
              <span>Receipt #:</span>
              <span>{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="pos-receipt-meta-row">
              <span>Date:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="pos-receipt-meta-row">
              <span>Cashier:</span>
              <span>{order.cashierId?.name || 'N/A'}</span>
            </div>
            <div className="pos-receipt-meta-row">
              <span>Payment:</span>
              <span className="pos-receipt-payment-badge">
                {order.paymentMethod?.toUpperCase()}
              </span>
            </div>
            {order.customerName && (
              <div className="pos-receipt-meta-row">
                <span>Customer:</span>
                <span>{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="pos-receipt-meta-row">
                <span>Phone:</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>

          <div className="pos-receipt-divider">{'─'.repeat(40)}</div>

          {/* Items */}
          <div className="pos-receipt-items">
            <div className="pos-receipt-items-header">
              <span className="pos-receipt-item-name-col">Item</span>
              <span className="pos-receipt-item-qty-col">Qty</span>
              <span className="pos-receipt-item-price-col">Price</span>
              <span className="pos-receipt-item-total-col">Total</span>
            </div>
            <div className="pos-receipt-divider-thin">{'─'.repeat(40)}</div>
            {order.items?.map((item, idx) => (
              <div key={idx} className="pos-receipt-item-row">
                <span className="pos-receipt-item-name-col">{item.name}</span>
                <span className="pos-receipt-item-qty-col">{item.quantity}</span>
                <span className="pos-receipt-item-price-col">
                  Rs.{item.price.toFixed(2)}
                </span>
                <span className="pos-receipt-item-total-col">
                  Rs.{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pos-receipt-divider">{'─'.repeat(40)}</div>

          {/* Totals */}
          <div className="pos-receipt-totals">
            <div className="pos-receipt-total-row">
              <span>Subtotal:</span>
              <span>Rs. {(order.subtotal ?? order.totalAmount).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="pos-receipt-total-row pos-receipt-discount">
                <span>
                  Discount
                  {order.discountType === 'percentage'
                    ? ` (${order.discountValue}%)`
                    : ''}
                  :
                </span>
                <span>-Rs. {order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {order.couponCode && (
              <div className="pos-receipt-total-row pos-receipt-discount">
                <span>Coupon ({order.couponCode}):</span>
                <span>-Rs. {(order.couponDiscount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="pos-receipt-total-row">
              <span>Tax:</span>
              <span>Rs. {(order.tax || 0).toFixed(2)}</span>
            </div>
            <div className="pos-receipt-divider-thin">{'─'.repeat(40)}</div>
            <div className="pos-receipt-total-row pos-receipt-grand-total">
              <span>TOTAL:</span>
              <span>Rs. {order.totalAmount.toFixed(2)}</span>
            </div>

            {order.paymentMethod === 'cash' && (
              <>
                <div className="pos-receipt-total-row">
                  <span>Tendered:</span>
                  <span>Rs. {(order.tenderedAmount || 0).toFixed(2)}</span>
                </div>
                <div className="pos-receipt-total-row pos-receipt-change">
                  <span>Change:</span>
                  <span>Rs. {(order.changeGiven || 0).toFixed(2)}</span>
                </div>
              </>
            )}

            {order.paymentMethod === 'koko' && (
              <div className="pos-receipt-total-row" style={{marginTop:'8px'}}>
                <span style={{fontSize:'11px', color:'#6b7280'}}>Koko Pay - Buy Now Pay Later</span>
              </div>
            )}
          </div>

          <div className="pos-receipt-divider">{'─'.repeat(40)}</div>

          <div className="pos-receipt-footer">
            <p>Thank you for shopping with us!</p>
            <p className="pos-receipt-footer-sub">
              Items: {order.items?.reduce((s, i) => s + i.quantity, 0)} |
              {' '}{formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action buttons — hidden when printing */}
        <div className="pos-invoice-actions no-print">
          <button className="pos-btn-outline" onClick={handlePrint}>
            <Printer size={18} />
            Print Receipt
          </button>
          <button className="pos-btn-green pos-btn-lg" onClick={handleNewSale}>
            <RotateCcw size={18} />
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
