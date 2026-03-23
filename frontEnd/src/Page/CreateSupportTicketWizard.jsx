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
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [issueForm, setIssueForm] = useState({
    type: 'Bug', priority: 'Normal', title: '', description: '', file: null
  });
  const fileInputRef = useRef(null);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState(null);

  const token = localStorage.getItem('accessToken');

  // ==========================================
  // FETCH PRODUCTS LOGIC 
  // ==========================================
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderAPI.getTicketProducts(); 
      const extractedProducts = data.map(item => ({
        orderId: item.orderId,
        vendorId: item.vendorId,
        productId: item.productId,
        productName: item.productName || 'Sản phẩm',
        vendorName: item.vendorName || 'Shop',
        productImage: item.productImage || 'https://via.placeholder.com/64',
        categoryName: item.categoryName || 'Phần mềm',
        paymentStatus: item.paymentStatus,
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('vi-VN') : 'Không rõ ngày',
        _rawData: item
      }));

      extractedProducts.sort((a, b) => b.orderId - a.orderId);
      setProducts(extractedProducts);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
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
  const defaultCategories = ['Antivirus Software', 'VPN & Network', 'Operating System', 'Design Tools', 'Khác'];
  const dynamicCategories = Array.from(new Set(products.map(getProductCategory)));
  const filterCategories = Array.from(new Set([...defaultCategories, ...dynamicCategories]));

  const filteredProducts = products.filter(p => {
    const matchSearch = (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(p.orderId).includes(searchTerm);
    const matchCategory = selectedCategory === '' || p.categoryName === selectedCategory;
    return matchSearch && matchCategory;
  });

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

  // ==========================================
  // RENDER UI: BƯỚC 4 (THÀNH CÔNG)
  // ==========================================
  if (step === 4) {
    return (
      <div className="t-layout-wrapper">
        <div className="t-card t-success-card slide-up">
          <div className="t-success-icon-wrap">
            <i className="bi bi-check-circle-fill t-success-icon"></i>
          </div>
          <h2 className="t-heading-lg mb-2">Gửi Yêu Cầu Thành Công</h2>
          <p className="t-text-muted mb-4">Mã hỗ trợ của bạn đã được ghi nhận vào hệ thống.</p>
          
          <div className="t-ticket-badge mb-4">
            <span className="t-text-muted small d-block mb-1 text-uppercase fw-bold">Ticket ID</span>
            <span className="t-ticket-id">{successTicketId}</span>
          </div>
          
          <p className="t-text-muted small mb-5">
            <i className="bi bi-info-circle me-1"></i> Nhà cung cấp sẽ kiểm tra và phản hồi bạn trong thời gian sớm nhất qua hệ thống.
          </p>
          <button onClick={() => navigate('/')} className="t-btn t-btn-primary w-100">
            Trở về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER UI: CHÍNH
  // ==========================================
  return (
    <div className="t-layout-wrapper">
      <div className="t-container">
        
        {/* HEADER & STEAM PROGRESS */}
        <div className="t-header-section text-center mb-5">
          <h2 className="t-heading-xl mb-2">Tạo Yêu Cầu Hỗ Trợ</h2>
          <p className="t-text-muted mb-5">Thực hiện 3 bước đơn giản để kết nối với nhà cung cấp phần mềm.</p>
          
          <div className="t-stepper">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className={`t-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                  <div className="t-step-circle">
                    {step > num ? <i className="bi bi-check-lg"></i> : num}
                  </div>
                  <span className="t-step-label">
                    {num === 1 ? 'Chọn Sản Phẩm' : num === 2 ? 'Mô Tả Lỗi' : 'Xác Nhận'}
                  </span>
                </div>
                {num < 3 && <div className={`t-step-line ${step > num ? 'active' : ''}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="t-card slide-up p-2 p-md-4">
          
          {error && (
            <div className="t-alert-error mb-4 animate-shake">
              <i className="bi bi-exclamation-diamond-fill me-3 fs-5"></i>
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: CHỌN SẢN PHẨM ================= */}
          {step === 1 && (
            <div className="fade-in">
              <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <h4 className="t-heading-md m-0">Đơn hàng cần hỗ trợ</h4>
              </div>

              {/* Toolbar */}
              <div className="row g-3 mb-4 px-2">
                <div className="col-md-7">
                  <div className="t-input-group">
                    <i className="bi bi-search t-input-icon"></i>
                    <input type="text" className="t-input with-icon" placeholder="Tìm theo tên phần mềm hoặc mã đơn hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="col-md-5">
                  <select className="t-input t-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">Tất cả danh mục</option>
                    {filterCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              {/* Product List */}
              {loading ? (
                <div className="t-empty-state">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div className="mt-3 text-muted">Đang tải danh sách...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="t-empty-state">
                  <i className="bi bi-inbox mb-2 d-block fs-1"></i>
                  <p className="m-0">Bạn chưa có đơn hàng nào hợp lệ.</p>
                </div>
              ) : (
                /* 🔥 KHUNG CUỘN (SCROLLBAR) NẰM Ở ĐÂY 🔥 */
                <div className="custom-scrollbar px-2" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <div className="t-product-grid pe-2 pb-2">
                    {filteredProducts.map((p, idx) => {
                      const isSelected = selectedProduct?.orderId === p.orderId && selectedProduct?.productId === p.productId;
                      return (
                        <div 
                          key={`${p.orderId}-${idx}`}
                          className={`t-product-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedProduct(p)}
                        >
                          <img src={p.productImage || 'https://via.placeholder.com/64'} alt="IMG" className="t-product-img" />
                          <div className="t-product-info">
                            <h6 className="t-product-name">{p.productName}</h6>
                            <div className="t-product-vendor"><i className="bi bi-shop me-1"></i>{p.vendorName}</div>
                            <div className="t-product-meta">
                              <span className="t-badge-order">#{p.orderId}</span>
                              <span className="t-badge-date">{p.purchaseDate}</span>
                            </div>
                          </div>
                          {/* Radio custom */}
                          <div className="t-radio-indicator"></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              <div className="t-footer-actions mx-2">
                <div></div> {/* Spacer */}
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
                  <select className="t-input t-select" value={issueForm.type} onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}>
                    <option value="Bug">Lỗi phần mềm (Bug)</option>
                    <option value="Installation">Vấn đề cài đặt (Installation)</option>
                    <option value="License">Kích hoạt bản quyền (License)</option>
                    <option value="Payment">Vấn đề thanh toán (Payment)</option>
                    <option value="Other">Vấn đề khác</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="t-label">Mức độ ưu tiên</label>
                  <select className="t-input t-select" value={issueForm.priority} onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}>
                    <option value="Low">Thấp (Cần tư vấn, không vội)</option>
                    <option value="Normal">Bình thường (Lỗi nhỏ, vẫn dùng được)</option>
                    <option value="High">Khẩn cấp (Crash ứng dụng, không thể làm việc)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="t-label">Tiêu đề tóm tắt <span className="text-danger">*</span></label>
                <input type="text" className="t-input" placeholder="Ví dụ: Không nhận key bản quyền trên Windows 11..." value={issueForm.title} onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })} />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between">
                  <label className="t-label">Mô tả chi tiết <span className="text-danger">*</span></label>
                  <span className="t-char-count">{issueForm.description.length}/20 ký tự</span>
                </div>
                <textarea rows="5" className="t-input custom-scrollbar" placeholder="Mô tả chi tiết các bước gây ra lỗi, mã lỗi hiển thị (nếu có)..." value={issueForm.description} onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}></textarea>
              </div>

              <div className="mb-4">
                <label className="t-label">Đính kèm hình ảnh (Tùy chọn)</label>
                {!issueForm.file ? (
                  <div className="t-dropzone" onClick={() => fileInputRef.current.click()}>
                    <i className="bi bi-image t-dropzone-icon"></i>
                    <div className="t-dropzone-text">Nhấn để chọn ảnh tải lên</div>
                    <div className="t-dropzone-hint">Hỗ trợ định dạng JPG, PNG (Tối đa 5MB)</div>
                    <input type="file" className="d-none" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                  </div>
                ) : (
                  <div className="t-file-item">
                    <div className="d-flex align-items-center overflow-hidden">
                      <div className="t-file-icon"><i className="bi bi-paperclip"></i></div>
                      <div className="d-flex flex-column overflow-hidden ms-3">
                        <span className="t-file-name text-truncate">{issueForm.file.name}</span>
                        <span className="t-file-size">{formatFileSize(issueForm.file.size)}</span>
                      </div>
                    </div>
                    <button className="t-btn-icon text-danger" onClick={removeFile} title="Xóa file">
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                )}
              </div>

              <div className="t-footer-actions">
                <button onClick={() => setStep(1)} className="t-btn t-btn-outline px-4">Trở Lại</button>
                <button onClick={handleNextToStep3} className="t-btn t-btn-primary px-4">Tiếp Tục <i className="bi bi-arrow-right ms-2"></i></button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: XÁC NHẬN ================= */}
          {step === 3 && (
            <div className="fade-in px-2">
              <h4 className="t-heading-md mb-4">Xác nhận thông tin</h4>
              
              {/* Product Summary */}
              <div className="t-summary-box mb-4">
                <h6 className="t-summary-title">Sản phẩm yêu cầu hỗ trợ</h6>
                <div className="d-flex align-items-center mt-3">
                  <img src={selectedProduct?.productImage} alt="Product" className="t-summary-img" />
                  <div>
                    <div className="t-summary-product">{selectedProduct?.productName}</div>
                    <div className="d-flex gap-3 mt-2 align-items-center">
                      <span className="t-badge-outline"><i className="bi bi-shop me-1"></i> {selectedProduct?.vendorName}</span>
                      <span className="t-badge-order-solid">Đơn: #{selectedProduct?.orderId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="t-summary-box mb-4">
                <h6 className="t-summary-title mb-4">Nội dung chi tiết</h6>
                
                <div className="row mb-4">
                  <div className="col-6">
                    <div className="t-info-label">Phân Loại Lỗi</div>
                    <div className="t-info-value">{issueForm.type}</div>
                  </div>
                  <div className="col-6">
                    <div className="t-info-label">Mức Độ Ưu Tiên</div>
                    <div className="t-info-value">
                      {issueForm.priority === 'High' && <span className="text-danger fw-bold"><i className="bi bi-fire me-1"></i>Khẩn cấp</span>}
                      {issueForm.priority === 'Normal' && <span className="text-warning fw-bold"><i className="bi bi-exclamation-circle me-1"></i>Bình thường</span>}
                      {issueForm.priority === 'Low' && <span className="text-success fw-bold"><i className="bi bi-info-circle me-1"></i>Thấp</span>}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="t-info-label">Tiêu Đề</div>
                  <div className="t-info-value fw-bold text-white">{issueForm.title}</div>
                </div>

                <div className="mb-4">
                  <div className="t-info-label">Mô Tả Chi Tiết</div>
                  <div className="t-info-desc custom-scrollbar">{issueForm.description}</div>
                </div>

                {issueForm.file && (
                  <div>
                    <div className="t-info-label">File Đính Kèm</div>
                    <div className="t-file-badge"><i className="bi bi-paperclip me-2 text-orange"></i>{issueForm.file.name}</div>
                  </div>
                )}
              </div>

              {/* Checkbox */}
              <div className="t-checkbox-wrapper mb-4">
                <input type="checkbox" className="t-checkbox" id="confirmCheck" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
                <label htmlFor="confirmCheck" className="t-checkbox-label">
                  Tôi cam đoan các thông tin cung cấp trên là chính xác. Nhà cung cấp sẽ tiếp nhận và phản hồi trong thời gian sớm nhất.
                </label>
              </div>

              <div className="t-footer-actions">
                <button onClick={() => setStep(2)} className="t-btn t-btn-outline px-4" disabled={isSubmitting}>Trở Lại</button>
                <button onClick={handleSubmit} disabled={!isConfirmed || isSubmitting} className="t-btn t-btn-primary px-4" style={{ minWidth: '160px' }}>
                  {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span> Đang gửi...</> : <>Gửi Yêu Cầu <i className="bi bi-send-fill ms-2"></i></>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          INJECTED CSS (FLAT DARK DESIGN)
      ========================================== */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* CORE VARIABLES */
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
          --t-radius-md: 10px;
          --t-radius-lg: 16px;
        }

        /* GLOBAL STYLES */
        .t-layout-wrapper {
          background-color: var(--t-bg-base);
          padding-bottom: 80px;
          color: var(--t-text-main);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .t-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* TYPOGRAPHY */
        .t-heading-xl { font-size: 2rem; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
        .t-heading-md { font-size: 1.25rem; font-weight: 600; color: #fff; letter-spacing: -0.01em; }
        .t-text-muted { color: var(--t-text-muted); font-size: 0.95rem; }

        /* CARD */
        .t-card {
          background-color: var(--t-bg-card);
          border: 1px solid var(--t-border);
          border-radius: var(--t-radius-lg);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.2);
        }
        
        /* STEPPER */
        .t-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 500px;
          margin: 0 auto;
        }
        .t-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .t-step-circle {
          width: 38px; height: 38px;
          border-radius: 50%;
          background-color: var(--t-bg-card);
          border: 2px solid var(--t-border);
          color: var(--t-text-faint);
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 1rem;
          transition: 0.3s;
        }
        .t-step.active .t-step-circle {
          border-color: var(--t-primary);
          color: var(--t-primary);
        }
        .t-step.completed .t-step-circle {
          background-color: var(--t-primary);
          border-color: var(--t-primary);
          color: white;
        }
        .t-step-label {
          margin-top: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--t-text-faint);
          transition: 0.3s;
        }
        .t-step.active .t-step-label, .t-step.completed .t-step-label { color: var(--t-text-main); }
        .t-step-line {
          flex-grow: 1;
          height: 2px;
          background-color: var(--t-border);
          margin: 0 12px;
          margin-top: -26px;
          transition: 0.3s;
        }
        .t-step-line.active { background-color: var(--t-primary); }

        /* BUTTONS */
        .t-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0.65rem 1.5rem;
          font-size: 0.95rem; font-weight: 600;
          border-radius: 8px;
          cursor: pointer; transition: 0.2s;
          outline: none; border: none;
        }
        .t-btn-primary {
          background-color: var(--t-primary); color: white; 
        }
        .t-btn-primary:hover:not(:disabled) { background-color: var(--t-primary-hover); transform: translateY(-1px); }
        .t-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .t-btn-outline {
          background-color: transparent; color: var(--t-text-main); border: 1px solid var(--t-border);
        }
        .t-btn-outline:hover:not(:disabled) { background-color: var(--t-bg-card-hover); color: white; }
        .t-btn-icon { background: none; border: none; padding: 0.5rem; border-radius: 6px; transition: 0.2s; cursor: pointer; }
        .t-btn-icon:hover { background-color: rgba(239, 68, 68, 0.1); }
        .t-footer-actions { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--t-border); }

        /* INPUTS & FORMS */
        .t-label {
          display: block; font-size: 0.8rem; font-weight: 600; color: var(--t-text-main); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .t-input-group { position: relative; }
        .t-input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--t-text-muted); }
        .t-input {
          width: 100%;
          background-color: #121214;
          border: 1px solid var(--t-border);
          color: var(--t-text-main);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          transition: 0.2s;
        }
        .t-input.with-icon { padding-left: 2.5rem; }
        .t-input:focus { border-color: var(--t-border-focus); outline: none; box-shadow: 0 0 0 1px var(--t-border-focus); }
        .t-input::placeholder { color: var(--t-text-faint); }
        select.t-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
        .t-char-count { font-size: 0.75rem; color: var(--t-text-faint); }

        /* PRODUCT LIST (STEP 1) */
        .t-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .t-product-grid { grid-template-columns: 1fr; }
        }
        .t-product-item {
          display: flex; align-items: center;
          padding: 0.85rem;
          background-color: #121214;
          border: 1px solid var(--t-border);
          border-radius: var(--t-radius-md);
          cursor: pointer; transition: 0.2s;
        }
        .t-product-item:hover { border-color: #52525b; background-color: var(--t-bg-card-hover); }
        .t-product-item.selected { border-color: var(--t-primary); background-color: rgba(249, 115, 22, 0.05); }
        .t-product-img { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; background-color: var(--t-border); flex-shrink: 0; }
        .t-product-info { margin-left: 1rem; flex-grow: 1; min-width: 0; }
        .t-product-name { margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .t-product-vendor { font-size: 0.8rem; color: var(--t-text-muted); margin-bottom: 6px; }
        .t-product-meta { display: flex; align-items: center; justify-content: space-between; }
        .t-badge-order { font-family: monospace; font-size: 0.8rem; background-color: #27272a; color: #facc15; padding: 2px 8px; border-radius: 4px; font-weight: 700;}
        .t-badge-date { font-size: 0.75rem; color: var(--t-text-faint); }
        .t-radio-indicator { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--t-border); margin-left: 0.5rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .t-product-item.selected .t-radio-indicator { border-color: var(--t-primary); }
        .t-product-item.selected .t-radio-indicator::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background-color: var(--t-primary); }

        /* DROPZONE & FILE */
        .t-dropzone { border: 1px dashed var(--t-border); border-radius: var(--t-radius-md); padding: 2rem; background-color: #121214; text-align: center; cursor: pointer; transition: 0.2s; }
        .t-dropzone:hover { border-color: var(--t-primary); background-color: rgba(249, 115, 22, 0.02); }
        .t-dropzone-icon { font-size: 2rem; color: var(--t-text-faint); margin-bottom: 0.5rem; display: block; }
        .t-dropzone-text { font-size: 0.95rem; font-weight: 500; color: var(--t-text-main); }
        .t-dropzone-hint { font-size: 0.8rem; color: var(--t-text-muted); margin-top: 4px; }
        .t-file-item { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; border: 1px solid var(--t-border); border-radius: var(--t-radius-md); background-color: #121214; }
        .t-file-icon { width: 36px; height: 36px; border-radius: 6px; background-color: rgba(249, 115, 22, 0.1); color: var(--t-primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .t-file-name { font-size: 0.85rem; font-weight: 500; color: var(--t-text-main); }
        .t-file-size { font-size: 0.75rem; color: var(--t-text-muted); }

        /* SUMMARY (STEP 3) */
        .t-summary-box { background-color: #121214; border: 1px solid var(--t-border); border-radius: var(--t-radius-md); padding: 1.5rem; }
        .t-summary-title { font-size: 0.85rem; font-weight: 600; color: var(--t-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .t-summary-img { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; border: 1px solid var(--t-border); }
        .t-summary-product { font-weight: 600; font-size: 1rem; color: #fff; }
        .t-badge-outline { font-size: 0.85rem; color: var(--t-text-muted); }
        .t-badge-order-solid { font-size: 0.85rem; font-family: monospace; font-weight: 600; color: #facc15; background-color: #27272a; padding: 3px 8px; border-radius: 4px; }
        .t-info-label { font-size: 0.75rem; color: var(--t-text-faint); margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;}
        .t-info-value { font-size: 0.95rem; color: var(--t-text-main); }
        .t-info-desc { font-size: 0.9rem; color: var(--t-text-muted); line-height: 1.6; background-color: #09090b; padding: 1rem; border-radius: 8px; border: 1px solid var(--t-border); }
        .t-file-badge { display: inline-flex; align-items: center; font-size: 0.85rem; background-color: #27272a; padding: 6px 12px; border-radius: 6px; color: var(--t-text-main); border: 1px solid #3f3f46; }

        /* CHECKBOX */
        .t-checkbox-wrapper { display: flex; align-items: flex-start; padding: 1rem 1.25rem; background-color: #121214; border: 1px solid var(--t-border); border-radius: 8px; }
        .t-checkbox { width: 18px; height: 18px; margin-right: 12px; margin-top: 2px; accent-color: var(--t-primary); cursor: pointer; }
        .t-checkbox-label { font-size: 0.85rem; color: var(--t-text-muted); cursor: pointer; user-select: none; line-height: 1.5; }

        /* SUCCESS VIEW */
        .t-success-card { padding: 3rem 2rem; max-width: 500px; margin: 0 auto; text-align: center; }
        .t-success-icon-wrap { display: flex; justify-content: center; margin-bottom: 1.5rem; }
        .t-success-icon { font-size: 4rem; color: #10b981; }
        .t-ticket-badge { background-color: #121214; border: 1px solid var(--t-border); padding: 1.5rem; border-radius: 12px; }
        .t-ticket-id { font-size: 2rem; font-weight: 700; color: var(--t-primary); font-family: monospace; letter-spacing: 1px;}

        /* ALERTS & STATES */
        .t-alert-error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 1rem; border-radius: 8px; display: flex; align-items: center; font-size: 0.95rem; }
        .t-empty-state { text-align: center; padding: 4rem 1rem; background-color: #121214; border: 1px dashed var(--t-border); border-radius: 12px; color: var(--t-text-muted); }

        /* UTILS */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }

        /* ANIMATIONS */
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}} />
    </div>
  );
};

export default CreateSupportTicketWizard;