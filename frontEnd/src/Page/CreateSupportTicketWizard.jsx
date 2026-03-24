import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from "../services/orderApi.js"; 
import api from "../services/api.js"; 

const CreateSupportTicketWizard = () => {
  const navigate = useNavigate();

  // State Logic
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [ticketContext, setTicketContext] = useState('PURCHASED'); 

  const [issueForm, setIssueForm] = useState({
    type: 'Bug', priority: 'Normal', title: '', description: '', file: null
  });
  const fileInputRef = useRef(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState(null);

  const token = localStorage.getItem('accessToken');

  // ==========================================
  // FETCH DỮ LIỆU TỪNG TAB
  // ==========================================
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const orderRes = await orderAPI.getTicketProducts(); 
      let orderArray = Array.isArray(orderRes) ? orderRes : (orderRes?.data || []);

      const extractedOrders = orderArray.map(item => ({
        orderId: item.orderId,
        vendorId: item.vendorId,
        productId: item.productId,
        productName: item.productName || 'Sản phẩm',
        vendorName: item.vendorName || 'Shop',
        productImage: item.productImage || 'https://via.placeholder.com/64',
        categoryName: item.categoryName || 'Phần mềm',
        paymentStatus: item.paymentStatus ? String(item.paymentStatus).toUpperCase() : 'UNKNOWN',
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('vi-VN') : 'Không rõ ngày',
        isOrder: true, 
        _rawData: item
      }));
      extractedOrders.sort((a, b) => b.orderId - a.orderId);
      setOrders(extractedOrders);

      try {
        const publicRes = await api.get('/api/orders/all-ticket-products');
        let prodArray = Array.isArray(publicRes.data) ? publicRes.data : [];
        
        const extractedAll = prodArray.map(p => ({
          orderId: null, 
          vendorId: p.vendorId,
          productId: p.productId,
          productName: p.productName,
          vendorName: p.vendorName,
          productImage: p.productImage || 'https://via.placeholder.com/64',
          categoryName: p.categoryName || 'Phần mềm',
          paymentStatus: 'N/A',
          purchaseDate: 'Chưa mua',
          isOrder: false, 
          _rawData: p
        }));
        setAllProducts(extractedAll);
      } catch (err) {
        console.warn("Lỗi khi tải danh sách toàn bộ sản phẩm:", err);
      }

    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProductCategory = (p) => p.categoryName || p.category || 'Phần mềm';
  const defaultCategories = ['Antivirus Software', 'VPN & Network', 'Operating System', 'Design Tools', 'Developer Tools', 'Office Utilities'];
  const dynamicCategories = Array.from(new Set([...orders, ...allProducts].map(getProductCategory)));
  const filterCategories = Array.from(new Set([...defaultCategories, ...dynamicCategories]));

  const dataSource = ticketContext === 'PLATFORM' ? allProducts : orders;
  const filteredProducts = dataSource.filter(p => {
    if (ticketContext === 'PURCHASED' && p.paymentStatus !== 'COMPLETED') return false;
    if (ticketContext === 'UNPAID' && p.paymentStatus === 'COMPLETED') return false;
      
    const matchSearch = (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.orderId && String(p.orderId).includes(searchTerm));
    const matchCategory = selectedCategory === '' || p.categoryName === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  const handleTabSwitch = (tabContext) => {
    setTicketContext(tabContext);
    setSelectedProduct(null); 
    
    let defaultType = 'Bug';
    if (tabContext === 'UNPAID') defaultType = 'Payment';
    if (tabContext === 'PLATFORM') defaultType = 'Pre-sale Inquiry';
    
    setIssueForm({ ...issueForm, type: defaultType, title: '', description: '' });
  };

  const handleNextToStep2 = () => {
    if (!selectedProduct) { setError('Vui lòng chọn một sản phẩm để tiếp tục.'); return; }
    if (!selectedProduct.vendorId) { setError('Sản phẩm bị thiếu dữ liệu nhà cung cấp. Vui lòng báo Admin!'); return; }
    setError(''); setStep(2);
  };

  const handleNextToStep3 = () => {
    if (!issueForm.title.trim()) { setError('Tiêu đề không được để trống.'); return; }
    if (issueForm.description.trim().length < 20) { setError('Mô tả phải chứa ít nhất 20 ký tự.'); return; }
    setError(''); setStep(3);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Kích thước ảnh không vượt quá 5MB.'); return; }
      setIssueForm({ ...issueForm, file: file });
      setError('');
    }
  };

  const removeFile = () => {
    setIssueForm({ ...issueForm, file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (selectedProduct.vendorId) formData.append('vendorId', selectedProduct.vendorId);
      if (selectedProduct.orderId) formData.append('orderId', selectedProduct.orderId);
      if (selectedProduct.productId) formData.append('productId', selectedProduct.productId);
      
      formData.append('subject', `[${issueForm.type}] ${issueForm.title}`);
      formData.append('description', issueForm.description);
      formData.append('priority', issueForm.priority);
      if (issueForm.file) formData.append('file', issueForm.file);

      const response = await api.post('/api/tickets/create', formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      const pad = (s) => String(s || '0').replace(/[^0-9]/g, '').padStart(6, '0');
      setSuccessTicketId(response.data.ticketId ? `TCK-2026-${pad(response.data.ticketId)}` : `TCK-2026-${pad('0')}`);
      setStep(4);
    } catch (err) {
      console.error("LỖI KHI GỌI API:", err);
      setError(err.response?.data?.error || err.message || 'Có lỗi xảy ra khi tạo ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4) {
    return (
      <div className="t-layout-wrapper">
        <div className="t-card t-success-card slide-up p-5 text-center mx-auto" style={{ maxWidth: '600px', marginTop: '10vh' }}>
          <div className="t-success-icon-wrap mb-4">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
          </div>
          <h2 className="t-heading-lg mb-3">Gửi Yêu Cầu Thành Công!</h2>
          <p className="t-text-muted mb-4 fs-5">Mã hỗ trợ của bạn đã được ghi nhận vào hệ thống.</p>
          <div className="t-ticket-badge mb-4 bg-dark p-4 rounded-4 border border-secondary border-opacity-25">
            <span className="t-text-muted small d-block mb-2 text-uppercase fw-bold">Ticket ID</span>
            <span className="t-ticket-id text-orange fs-2 font-monospace fw-bolder">{successTicketId}</span>
          </div>
          <p className="t-text-muted small mb-5">
            <i className="bi bi-info-circle me-1 text-orange"></i> Vendor sẽ kiểm tra và phản hồi bạn trong thời gian sớm nhất.
          </p>
          <button onClick={() => navigate('/')} className="t-btn t-btn-primary w-100 py-3 fs-5 rounded-3">Trở về Trang Chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="t-layout-wrapper">
      <div className="t-container">
        
        <div className="t-header-section text-center mb-5">
          <h2 className="t-heading-xl mb-3">Tạo Yêu Cầu Hỗ Trợ</h2>
          <p className="t-text-muted mb-5">Thực hiện 3 bước đơn giản để gửi yêu cầu đến nhà cung cấp phần mềm.</p>
          
          <div className="t-stepper">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className={`t-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                  <div className="t-step-circle">{step > num ? <i className="bi bi-check-lg"></i> : num}</div>
                  <span className="t-step-label">{num === 1 ? 'Chọn Sản Phẩm' : num === 2 ? 'Mô Tả Lỗi' : 'Xác Nhận'}</span>
                </div>
                {num < 3 && <div className={`t-step-line ${step > num ? 'active' : ''}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="t-card slide-up p-4 p-md-5">
          {error && (
            <div className="t-alert-error mb-4 animate-shake">
              <i className="bi bi-exclamation-diamond-fill me-3 fs-4"></i><span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: CHỌN SẢN PHẨM ================= */}
          {step === 1 && (
            <div className="fade-in">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2 gap-3">
                <h4 className="t-heading-md m-0">Chọn đối tượng cần hỗ trợ</h4>
                
                {/* 🔥 ĐÃ SỬA: TAB HIỂN THỊ MỜ CHO CÁC MỤC KHÔNG CHỌN */}
                <div className="t-tabs bg-dark p-1 rounded-3 border border-secondary border-opacity-50 d-flex flex-wrap gap-1">
                  <button 
                    className={`btn rounded-2 border-0 fw-bold px-3 py-2 t-tab-btn ${ticketContext === 'PURCHASED' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('PURCHASED')}
                  >
                    Đã thanh toán
                  </button>
                  <button 
                    className={`btn rounded-2 border-0 fw-bold px-3 py-2 t-tab-btn ${ticketContext === 'UNPAID' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('UNPAID')}
                  >
                    Vấn đề khi mua
                  </button>
                  <button 
                    className={`btn rounded-2 border-0 fw-bold px-3 py-2 t-tab-btn ${ticketContext === 'PLATFORM' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('PLATFORM')}
                  >
                    Tất cả sản phẩm
                  </button>
                </div>
              </div>

              <div className="row g-3 mb-4 px-2">
                <div className="col-md-7">
                  <div className="t-input-group">
                    <i className="bi bi-search t-input-icon"></i>
                    <input type="text" className="t-input with-icon py-3" placeholder="Tìm theo tên phần mềm hoặc mã đơn hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="col-md-5">
                  <select className="t-input t-select py-3" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">Tất cả danh mục</option>
                    {filterCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="t-empty-state">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <div className="text-muted">Đang tải danh sách...</div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="t-empty-state">
                  {ticketContext === 'PURCHASED' && <><i className="bi bi-inbox mb-3 d-block fs-1"></i><p className="m-0 fs-5">Bạn chưa có đơn hàng nào thanh toán thành công.</p></>}
                  {ticketContext === 'UNPAID' && <><i className="bi bi-cart-check mb-3 d-block fs-1"></i><p className="m-0 fs-5">Tuyệt vời! Bạn không có giao dịch nào bị lỗi.</p></>}
                  {ticketContext === 'PLATFORM' && <><i className="bi bi-box mb-3 d-block fs-1"></i><p className="m-0 fs-5">Không tìm thấy sản phẩm nào trên hệ thống.</p></>}
                </div>
              ) : (
                <div className="custom-scrollbar pe-2" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <div className="t-product-grid pb-2">
                    {filteredProducts.map((p, idx) => {
                      const isSelected = selectedProduct?.orderId === p.orderId && selectedProduct?.productId === p.productId;
                      return (
                        <div key={`${p.orderId || p.productId}-${idx}`} className={`t-product-item ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedProduct(p)}>
                          <img src={p.productImage || 'https://via.placeholder.com/64'} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/64?text=No+Image'; }} alt="IMG" className="t-product-img" />
                          <div className="t-product-info">
                            <h6 className="t-product-name">{p.productName}</h6>
                            <div className="t-product-vendor"><i className="bi bi-shop me-1"></i>{p.vendorName}</div>
                            
                            <div className="t-product-meta">
                              {p.isOrder ? (
                                <>
                                  <span className="t-badge-order">#{p.orderId}</span>
                                  <span className={`badge ${p.paymentStatus === 'COMPLETED' ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10 border-0 px-2 py-1 fw-medium`}>
                                    {p.paymentStatus}
                                  </span>
                                </>
                              ) : (
                                <span className="badge bg-info bg-opacity-10 text-info border-0 px-2 py-1 fw-medium">
                                  Hỗ trợ chung
                                </span>
                              )}
                            </div>

                          </div>
                          <div className="t-radio-indicator"></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              <div className="t-footer-actions mx-2 mt-4 pt-4">
                <div></div>
                <button onClick={handleNextToStep2} disabled={!selectedProduct} className="t-btn t-btn-primary px-4">
                  Tiếp Tục <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: MÔ TẢ ================= */}
          {step === 2 && (
            <div className="fade-in px-2">
              <h4 className="t-heading-md mb-4">Chi tiết yêu cầu hỗ trợ</h4>
              
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="t-label">Loại vấn đề</label>
                  <select className="t-input t-select py-3" value={issueForm.type} onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}>
                    {ticketContext === 'PURCHASED' && (
                      <>
                        <option value="Bug">🐛 Lỗi phần mềm (Bug)</option>
                        <option value="Installation">⚙️ Vấn đề cài đặt / Hướng dẫn</option>
                        <option value="License">🔑 Kích hoạt bản quyền / Thu hồi máy</option>
                        <option value="Other">💬 Vấn đề khác</option>
                      </>
                    )}
                    {ticketContext === 'UNPAID' && (
                      <>
                        <option value="Payment">💳 Lỗi thanh toán / VNPay lỗi</option>
                        <option value="Delivery">📦 Đã trừ tiền nhưng đơn hàng chưa duyệt</option>
                        <option value="Coupon">🎫 Lỗi nhập Mã giảm giá</option>
                        <option value="Other">💬 Vấn đề khác</option>
                      </>
                    )}
                    {ticketContext === 'PLATFORM' && (
                      <>
                        <option value="Pre-sale Inquiry">❓ Tư vấn thông tin trước khi mua</option>
                        <option value="Feature Question">💡 Hỏi đáp tính năng chi tiết</option>
                        <option value="Report">⚠️ Báo cáo phần mềm vi phạm / Độc hại</option>
                        <option value="Other">💬 Vấn đề khác</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="t-label">Mức độ ưu tiên</label>
                  <select className="t-input t-select py-3" value={issueForm.priority} onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}>
                    <option value="Low">Thấp (Cần tư vấn, không vội)</option>
                    <option value="Normal">Bình thường (Lỗi nhẹ, vẫn tiếp tục được)</option>
                    <option value="High">Khẩn cấp (Bị trừ tiền oan, Mất tài khoản, Không thể làm việc)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="t-label">Tiêu đề tóm tắt <span className="text-danger">*</span></label>
                <input type="text" className="t-input py-3" placeholder={ticketContext === 'PLATFORM' ? "Ví dụ: Phần mềm này có chạy được trên Mac M3 không?..." : "Ví dụ: Phần mềm không nhận Key..."} value={issueForm.title} onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })} />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between">
                  <label className="t-label">Mô tả chi tiết <span className="text-danger">*</span></label>
                  <span className="t-char-count">{issueForm.description.length}/20 ký tự</span>
                </div>
                <textarea rows="5" className="t-input custom-scrollbar" placeholder="Viết rõ ràng vấn đề để nhà cung cấp có thể giúp bạn nhanh nhất..." value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}></textarea>
              </div>

              <div className="mb-4">
                <label className="t-label">Đính kèm hình ảnh minh chứng (Tùy chọn)</label>
                {!issueForm.file ? (
                  <div className="t-dropzone py-4" onClick={() => fileInputRef.current.click()}>
                    <i className="bi bi-image t-dropzone-icon"></i>
                    <div className="t-dropzone-text">Nhấn để chọn ảnh tải lên</div>
                    <div className="t-dropzone-hint mt-2">Ảnh màn hình lỗi, Hóa đơn trừ tiền (JPG, PNG)</div>
                    <input type="file" className="d-none" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="t-file-item py-3 px-4">
                    <div className="d-flex align-items-center overflow-hidden">
                      <div className="t-file-icon"><i className="bi bi-paperclip"></i></div>
                      <div className="d-flex flex-column overflow-hidden ms-3">
                        <span className="t-file-name text-truncate fs-6">{issueForm.file.name}</span>
                        <span className="t-file-size mt-1">{formatFileSize(issueForm.file.size)}</span>
                      </div>
                    </div>
                    <button className="t-btn-icon text-danger fs-5" onClick={removeFile} title="Xóa file"><i className="bi bi-trash3"></i></button>
                  </div>
                )}
              </div>

              <div className="t-footer-actions mt-4 pt-4 border-top">
                <button onClick={() => setStep(1)} className="t-btn t-btn-outline px-4 py-2">Trở Lại</button>
                <button onClick={handleNextToStep3} className="t-btn t-btn-primary px-4">Tiếp Tục <i className="bi bi-arrow-right ms-2"></i></button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: XÁC NHẬN ================= */}
          {step === 3 && (
            <div className="fade-in px-2">
              <h4 className="t-heading-md mb-4">Xác nhận thông tin</h4>
              <div className="t-summary-box mb-4 p-4">
                <h6 className="t-summary-title mb-3">Đối tượng hỗ trợ</h6>
                <div className="d-flex align-items-center mt-3">
                  <img src={selectedProduct?.productImage} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/64?text=No+Image'; }} alt="Product" className="t-summary-img me-4" style={{ width: '70px', height: '70px' }} />
                  <div>
                    <div className="t-summary-product fs-5 mb-1">{selectedProduct?.productName}</div>
                    <div className="d-flex gap-3 mt-2 align-items-center">
                      <span className="t-badge-outline"><i className="bi bi-shop me-1"></i> {selectedProduct?.vendorName}</span>
                      {selectedProduct?.orderId ? (
                         <span className="t-badge-order-solid">Đơn: #{selectedProduct?.orderId}</span>
                      ) : (
                         <span className="badge bg-info bg-opacity-10 text-info border-0 px-2 py-1 fw-medium">Câu hỏi Pre-sale</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="t-summary-box mb-4 p-4">
                <h6 className="t-summary-title mb-4">Nội dung chi tiết</h6>
                <div className="row mb-4">
                  <div className="col-6">
                    <div className="t-info-label">Phân Loại</div>
                    <div className="t-info-value fs-6">{issueForm.type}</div>
                  </div>
                  <div className="col-6">
                    <div className="t-info-label">Mức Độ Ưu Tiên</div>
                    <div className="t-info-value fs-6">
                      {issueForm.priority === 'High' && <span className="text-danger fw-bold"><i className="bi bi-fire me-1"></i>Khẩn cấp</span>}
                      {issueForm.priority === 'Normal' && <span className="text-warning fw-bold"><i className="bi bi-exclamation-circle me-1"></i>Bình thường</span>}
                      {issueForm.priority === 'Low' && <span className="text-success fw-bold"><i className="bi bi-info-circle me-1"></i>Thấp</span>}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="t-info-label">Tiêu Đề</div>
                  <div className="t-info-value fw-bold text-white fs-5">{issueForm.title}</div>
                </div>
                <div className="mb-4">
                  <div className="t-info-label">Mô Tả Chi Tiết</div>
                  <div className="t-info-desc custom-scrollbar p-3 fs-6">{issueForm.description}</div>
                </div>
                {issueForm.file && (
                  <div>
                    <div className="t-info-label">File Đính Kèm</div>
                    <div className="t-file-badge px-3 py-2 fs-6"><i className="bi bi-paperclip me-2 text-orange"></i>{issueForm.file.name}</div>
                  </div>
                )}
              </div>

              <div className="t-checkbox-wrapper mb-4 p-3 p-md-4">
                <input type="checkbox" className="t-checkbox mt-1" id="confirmCheck" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
                <label htmlFor="confirmCheck" className="t-checkbox-label fs-6 ms-2">Tôi cam đoan các thông tin cung cấp trên là chính xác. Hệ thống sẽ ghi nhận và gửi đến bộ phận phụ trách.</label>
              </div>

              <div className="t-footer-actions mt-4 pt-4 border-top">
                <button onClick={() => setStep(2)} className="t-btn t-btn-outline px-4 py-2" disabled={isSubmitting}>Trở Lại</button>
                <button onClick={handleSubmit} disabled={!isConfirmed || isSubmitting} className="t-btn t-btn-primary px-5 py-2" style={{ minWidth: '180px' }}>
                  {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang gửi...</> : <>Gửi Yêu Cầu <i className="bi bi-send-fill ms-2"></i></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔥 CSS ĐÃ ĐƯỢC BỔ SUNG CLASS .t-tab-btn ĐỂ XỬ LÝ ĐỘ MỜ 🔥 */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --t-bg-base: transparent;
          --t-bg-card: #09090b;
          --t-bg-card-hover: #18181b;
          --t-border: #27272a;
          --t-border-focus: #ea580c;
          --t-primary: #f97316;
          --t-primary-hover: #ea580c;
          --t-text-main: #f4f4f5;
          --t-text-muted: #a1a1aa;
          --t-text-faint: #52525b;
          --t-radius-md: 12px;
          --t-radius-lg: 20px;
        }

        /* --- STYLES CHO TAB NÚT BẤM (MỚI) --- */
        .t-tab-btn {
          color: var(--t-text-muted);
          background-color: transparent;
          opacity: 0.5; /* Mờ đi 50% khi không được chọn */
          transition: all 0.3s ease;
        }
        .t-tab-btn:hover {
          opacity: 0.8; /* Sáng lên 80% khi di chuột */
          color: var(--t-text-main);
        }
        .t-tab-btn.active {
          background-color: var(--t-primary) !important;
          color: white !important;
          opacity: 1; /* Sáng rõ 100% khi được chọn */
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25) !important;
        }
        /* ------------------------------------ */

        .t-layout-wrapper { background-color: var(--t-bg-base); padding-bottom: 80px; color: var(--t-text-main); font-family: 'Inter', system-ui, sans-serif; }
        .t-container { max-width: 900px; margin: 0 auto; padding: 0 1rem; }

        .t-heading-xl { font-size: 2.2rem; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
        .t-heading-md { font-size: 1.35rem; font-weight: 600; color: #fff; letter-spacing: -0.01em; }
        .t-text-muted { color: var(--t-text-muted); font-size: 1rem; }

        .t-card { background-color: var(--t-bg-card); border: 1px solid var(--t-border); border-radius: var(--t-radius-lg); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.2); }
        
        .t-stepper { display: flex; align-items: center; justify-content: space-between; max-width: 600px; margin: 0 auto; }
        .t-step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; }
        .t-step-circle { width: 42px; height: 42px; border-radius: 50%; background-color: var(--t-bg-card); border: 2px solid var(--t-border); color: var(--t-text-faint); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; transition: 0.3s; }
        .t-step.active .t-step-circle { border-color: var(--t-primary); color: var(--t-primary); }
        .t-step.completed .t-step-circle { background-color: var(--t-primary); border-color: var(--t-primary); color: white; }
        .t-step-label { margin-top: 10px; font-size: 0.85rem; font-weight: 600; color: var(--t-text-faint); transition: 0.3s; }
        .t-step.active .t-step-label, .t-step.completed .t-step-label { color: var(--t-text-main); }
        .t-step-line { flex-grow: 1; height: 2px; background-color: var(--t-border); margin: 0 12px; margin-top: -28px; transition: 0.3s; }
        .t-step-line.active { background-color: var(--t-primary); }

        .t-btn { display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 600; border-radius: 10px; cursor: pointer; transition: 0.2s; outline: none; border: none; }
        .t-btn-primary { background-color: var(--t-primary); color: white; }
        .t-btn-primary:hover:not(:disabled) { background-color: var(--t-primary-hover); transform: translateY(-2px); }
        .t-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .t-btn-outline { background-color: transparent; color: var(--t-text-main); border: 1px solid var(--t-border); }
        .t-btn-outline:hover:not(:disabled) { background-color: var(--t-bg-card-hover); color: white; }
        .t-btn-icon { background: none; border: none; padding: 0.5rem; border-radius: 8px; transition: 0.2s; cursor: pointer; }
        .t-btn-icon:hover { background-color: rgba(239, 68, 68, 0.1); }
        .t-footer-actions { display: flex; justify-content: space-between; border-color: var(--t-border) !important; }

        .t-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--t-text-main); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .t-input-group { position: relative; }
        .t-input-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--t-text-muted); font-size: 1.1rem; }
        .t-input { width: 100%; background-color: #121214; border: 1px solid var(--t-border); color: var(--t-text-main); border-radius: 10px; padding: 0.85rem 1.25rem; font-size: 1rem; transition: 0.2s; }
        .t-input.with-icon { padding-left: 2.75rem; }
        .t-input:focus { border-color: var(--t-border-focus); outline: none; box-shadow: 0 0 0 1px var(--t-border-focus); }
        .t-input::placeholder { color: var(--t-text-faint); }
        select.t-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
        .t-char-count { font-size: 0.8rem; color: var(--t-text-faint); }

        .t-product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        @media (max-width: 768px) { .t-product-grid { grid-template-columns: 1fr; } }
        .t-product-item { display: flex; align-items: center; padding: 1rem; background-color: #121214; border: 1px solid var(--t-border); border-radius: var(--t-radius-md); cursor: pointer; transition: 0.2s; }
        .t-product-item:hover { border-color: #52525b; background-color: var(--t-bg-card-hover); }
        .t-product-item.selected { border-color: var(--t-primary); background-color: rgba(249, 115, 22, 0.05); }
        .t-product-img { width: 64px; height: 64px; border-radius: 8px; object-fit: cover; background-color: var(--t-border); flex-shrink: 0; }
        .t-product-info { margin-left: 1rem; flex-grow: 1; min-width: 0; }
        .t-product-name { margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .t-product-vendor { font-size: 0.85rem; color: var(--t-text-muted); margin-bottom: 8px; }
        .t-product-meta { display: flex; align-items: center; justify-content: space-between; }
        .t-badge-order { font-family: monospace; font-size: 0.85rem; background-color: #27272a; color: #facc15; padding: 2px 8px; border-radius: 4px; font-weight: 700;}
        .t-radio-indicator { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--t-border); margin-left: 0.5rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .t-product-item.selected .t-radio-indicator { border-color: var(--t-primary); }
        .t-product-item.selected .t-radio-indicator::after { content: ''; width: 10px; height: 10px; border-radius: 50%; background-color: var(--t-primary); }

        .t-dropzone { border: 1px dashed var(--t-border); border-radius: var(--t-radius-md); background-color: #121214; text-align: center; cursor: pointer; transition: 0.2s; }
        .t-dropzone:hover { border-color: var(--t-primary); background-color: rgba(249, 115, 22, 0.02); }
        .t-dropzone-icon { font-size: 3rem; color: var(--t-text-faint); margin-bottom: 0.5rem; display: block; }
        .t-dropzone-text { font-size: 1.05rem; font-weight: 600; color: var(--t-text-main); }
        .t-dropzone-hint { font-size: 0.85rem; color: var(--t-text-muted); }
        .t-file-item { display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--t-border); border-radius: var(--t-radius-md); background-color: #121214; }
        .t-file-icon { width: 42px; height: 42px; border-radius: 8px; background-color: rgba(249, 115, 22, 0.1); color: var(--t-primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }

        .t-summary-box { background-color: #121214; border: 1px solid var(--t-border); border-radius: var(--t-radius-md); }
        .t-summary-title { font-size: 0.9rem; font-weight: 600; color: var(--t-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .t-summary-img { border-radius: 8px; object-fit: cover; border: 1px solid var(--t-border); }
        .t-summary-product { font-weight: 600; color: #fff; }
        .t-badge-outline { font-size: 0.85rem; color: var(--t-text-muted); }
        .t-badge-order-solid { font-size: 0.85rem; font-family: monospace; font-weight: 600; color: #facc15; background-color: #27272a; padding: 3px 8px; border-radius: 4px; }
        .t-info-label { font-size: 0.75rem; color: var(--t-text-faint); margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;}
        .t-info-desc { color: var(--t-text-muted); line-height: 1.6; background-color: #09090b; border-radius: 8px; border: 1px solid var(--t-border); }
        .t-file-badge { display: inline-flex; align-items: center; background-color: #27272a; border-radius: 8px; color: var(--t-text-main); border: 1px solid #3f3f46; }

        .t-checkbox-wrapper { background-color: #121214; border: 1px solid var(--t-border); border-radius: 10px; }
        .t-checkbox { width: 20px; height: 20px; accent-color: var(--t-primary); cursor: pointer; }
        .t-checkbox-label { color: var(--t-text-muted); cursor: pointer; user-select: none; line-height: 1.5; }

        .t-success-icon-wrap { display: flex; justify-content: center; margin-bottom: 1.5rem; }
        .t-ticket-badge { background-color: #121214; border: 1px solid var(--t-border); padding: 1.5rem; border-radius: 12px; }
        .t-alert-error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 1.25rem; border-radius: 10px; display: flex; align-items: center; font-size: 1rem; }
        .t-empty-state { text-align: center; padding: 5rem 1rem; background-color: #121214; border: 1px dashed var(--t-border); border-radius: 16px; color: var(--t-text-muted); }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }

        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}} />
    </div>
  );
};

export default CreateSupportTicketWizard;