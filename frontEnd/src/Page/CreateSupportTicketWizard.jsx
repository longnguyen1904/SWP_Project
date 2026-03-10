import React, { useState, useEffect, useRef } from 'react';

const CreateSupportTicketWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Step 2 State (Đã bổ sung priority và file)
  const [issueForm, setIssueForm] = useState({
    type: 'Bug',
    priority: 'Normal', // Giá trị mặc định
    title: '',
    description: '',
    file: null // Lưu trữ file đính kèm
  });
  
  const fileInputRef = useRef(null); // Ref để trigger nút chọn file ẩn

  // Step 3 State
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success State
  const [successTicketId, setSuccessTicketId] = useState(null);

  // ==========================================
  // XỬ LÝ AUTHENTICATION ĐỘNG THEO BACKEND
  // ==========================================
  const token = localStorage.getItem('accessToken');
  
  let userId = null;
  if (token && token.startsWith('TOKEN_')) {
    const parts = token.split('_');
    if (parts.length > 1) {
      userId = parts[1];
    }
  }

  // ==========================================
  // FETCH PRODUCTS VÀ KHÔNG LỌC TRÙNG NỮA
  // ==========================================
  const fetchProducts = async () => {
    if (!token || !userId) {
      setError('Bạn chưa đăng nhập hoặc Token không hợp lệ. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await orderAPI.getUserOrders();
      const extractedProducts = [];

      data.forEach(order => {
        const status = String(order.paymentStatus || order.status || '').toUpperCase();
        
        if (status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS') {
          const p = order.product || {};
          
          // Lấy ngày mua (Tuỳ thuộc vào backend trả về trường nào, ví dụ orderDate, createdAt, date...)
          const rawDate = order.orderDate || order.createdAt || order.date || order.paymentDate;
          const purchaseDate = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : 'Không rõ ngày';

          extractedProducts.push({
            orderId: order.orderID || order.orderId || order.id,
            vendorId: p.vendor?.vendorId || p.vendor?.vendorID || p.vendor?.id || p.vendor?.userID || p.vendorId || p.vendorID || order.vendorId || order.vendorID, 
            productId: p.productId || p.id,
            productName: p.productName || p.name || 'Sản phẩm',
            vendorName: p.vendor?.shopName || p.vendor?.name || p.vendorName || 'Shop',
            productImage: p.imageUrl || p.image || p.thumbnail || 'https://via.placeholder.com/64',
            categoryName: p.category?.categoryName || p.category?.name || p.categoryName || 'Phần mềm',
            paymentStatus: status,
            purchaseDate: purchaseDate, // <-- Lưu thêm ngày mua
            _rawData: p 
          });
        }
      });

      // Sắp xếp đơn hàng mới nhất lên đầu
      extractedProducts.sort((a, b) => b.orderId - a.orderId);

      setProducts(extractedProducts);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải sản phẩm');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Vui lòng đăng nhập để sử dụng tính năng tạo Ticket.');
    } else {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  // ==========================================
  // LOGIC LỌC SẢN PHẨM
  // ==========================================
  const getProductCategory = (p) => p.categoryName || p.category || 'Antivirus Software'; 
  
  const defaultCategories = ['Antivirus Software', 'VPN & Network', 'Operating System', 'Design Tools', 'Khác'];
  const dynamicCategories = Array.from(new Set(products.map(getProductCategory)));
  const filterCategories = Array.from(new Set([...defaultCategories, ...dynamicCategories]));

  const filteredProducts = products.filter(p => {
    const matchSearch = 
      (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.orderId).includes(searchTerm);
    const cat = getProductCategory(p);
    const matchCategory = selectedCategory === '' || cat === selectedCategory;
    return matchSearch && matchCategory;
  });

  // ==========================================
  // HANDLERS BƯỚC 2
  // ==========================================
  const handleNextToStep2 = () => {
    if (!selectedProduct) {
      setError('Vui lòng chọn một sản phẩm (đơn hàng) để tiếp tục.');
      return;
    }
    
    // CHẶN ĐỨNG NẾU KHÔNG TÌM THẤY VENDOR ID
    if (!selectedProduct.vendorId) {
       setError('Sản phẩm này bị thiếu dữ liệu mã Shop (Vendor ID) từ hệ thống. Vui lòng chọn sản phẩm khác hoặc báo lại cho Admin!');
       return; 
    }

    setError('');
    setStep(2);
  };

  const handleNextToStep3 = () => {
    if (!issueForm.title.trim()) {
      setError('Tiêu đề không được để trống.');
      return;
    }
    if (issueForm.description.trim().length < 20) {
      setError('Mô tả vấn đề phải chứa ít nhất 20 ký tự.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra dung lượng file (Ví dụ: giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB.');
        return;
      }
      setIssueForm({...issueForm, file: file});
      setError('');
    }
  };

  const removeFile = () => {
    setIssueForm({...issueForm, file: null});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ==========================================
  // SUBMIT TICKET (STEP 3) - DÙNG FORMDATA
  // ==========================================
  const handleSubmit = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    setError('');

    try {
      const finalSubject = `[${issueForm.type}] ${issueForm.title}`;
      
      // 1. Gói dữ liệu vào FormData (bao gồm cả File và Text)
      const formData = new FormData();
      formData.append('vendorId', selectedProduct.vendorId);
      if (selectedProduct.orderId) {
        formData.append('orderId', selectedProduct.orderId);
      }
      // Gửi kèm productId phòng trường hợp API của bạn vẫn cần
      if (selectedProduct.productId) {
        formData.append('productId', selectedProduct.productId);
      }
      
      formData.append('subject', finalSubject);
      formData.append('description', issueForm.description);
      formData.append('priority', issueForm.priority);
      
      if (issueForm.file) {
        formData.append('file', issueForm.file);
      }

      // 2. Gửi Fetch API tới Backend
      const response = await fetch('http://localhost:8081/api/tickets/create', {
        method: 'POST',
        headers: {
          // LƯU Ý SỐ 1: Bắt buộc dùng Backtick (dấu ` `) để truyền biến token
          'Authorization': `Bearer ${token}`
          // LƯU Ý SỐ 2: TUYỆT ĐỐI KHÔNG viết 'Content-Type': 'multipart/form-data' ở đây!
          // Trình duyệt sẽ TỰ ĐỘNG lo việc đó khi nhận diện được body là FormData.
        },
        body: formData
      });

      // 3. Xử lý kết quả trả về
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Có lỗi xảy ra khi tạo ticket. Vui lòng thử lại.');
      }

      const result = await response.json();
      const pad = (s) => String(s || '0').replace(/[^0-9]/g, '').padStart(6, '0');
      setSuccessTicketId(result.ticketId ? `TCK-2026-${pad(result.ticketId)}` : `TCK-2026-${pad('0')}`);
      
      // Chuyển sang bước 4 (Thành công)
      setStep(4);
      
    } catch (err) {
      console.error("LỖI FETCH:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // THEME STYLES (UI Vũ trụ)
  // ==========================================
  const themeColor = '#f26522'; 
  const cardBg = 'rgba(30, 30, 30, 0.6)'; 
  const inputBg = 'rgba(20, 20, 20, 0.8)';
  const borderColor = '#444';
  const textColor = '#e0e0e0';

  const customInputStyle = {
    backgroundColor: inputBg,
    color: '#fff',
    borderColor: borderColor,
    colorScheme: 'dark' 
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return '#ef4444'; // Đỏ
    if (priority === 'Low') return '#10b981'; // Xanh
    return '#eab308'; // Vàng
  };

  const getPriorityLabel = (priority) => {
    if (priority === 'High') return '🔴 Khẩn cấp (SLA: 4h)';
    if (priority === 'Low') return '🟢 Thấp (SLA: 48h)';
    return '🟡 Bình thường (SLA: 24h)';
  };

  // ==========================================
  // RENDER UI 
  // ==========================================
  if (step === 4) {
    return (
      <div className="container" style={{ paddingTop: '100px', maxWidth: '700px' }}>
        <div className="card text-center p-5 border-0" style={{ backgroundColor: cardBg, color: textColor, borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
          <div className="mb-3" style={{ fontSize: '4rem', color: '#4ade80' }}>
            <i className="bi bi-check-circle-fill">✅</i>
          </div>
          <h2 className="fw-bold mb-3 text-white">Tạo Ticket Thành Công!</h2>
          <p className="mb-4 text-light">Mã hỗ trợ của bạn là: <strong style={{ color: themeColor, fontSize: '1.2rem' }}>{successTicketId}</strong></p>
          <p className="small mb-4" style={{ color: '#aaa' }}>Vendor đã nhận được thông báo và sẽ phản hồi bạn sớm nhất.</p>
          <div>
            <button onClick={() => window.location.href = '/'} className="btn px-5 py-2 fw-semibold" style={{ backgroundColor: themeColor, color: '#fff', borderRadius: '8px' }}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '80px', maxWidth: '850px', paddingBottom: '80px' }}>
      
      {/* Progress Bar */}
      <div className="d-flex justify-content-between align-items-center mb-5 px-4 position-relative">
        <div className="position-absolute" style={{ top: '20px', left: '12%', right: '12%', height: '2px', backgroundColor: borderColor, zIndex: 0 }}></div>
        {[1, 2, 3].map((num) => (
          <div key={num} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{ 
                width: '45px', height: '45px', 
                backgroundColor: step >= num ? themeColor : '#1a1a1a', 
                color: step >= num ? '#fff' : '#666',
                border: step >= num ? 'none' : `2px solid ${borderColor}`,
                transition: 'all 0.3s ease'
              }}
            >
              {num}
            </div>
            <span className="small mt-2 fw-semibold" style={{ color: step >= num ? '#fff' : '#666' }}>
              {num === 1 ? 'Chọn Sản Phẩm' : num === 2 ? 'Chi Tiết Vấn Đề' : 'Xác Nhận'}
            </span>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-lg" style={{ backgroundColor: cardBg, color: textColor, borderRadius: '16px', backdropFilter: 'blur(12px)', border: `1px solid ${borderColor}` }}>
        <div className="card-body p-4 p-md-5">
          
          {error && (
            <div className="alert border-0 py-3 d-flex align-items-center mb-4" style={{ backgroundColor: 'rgba(220, 53, 69, 0.15)', color: '#ff6b6b', borderRadius: '8px' }}>
              <span className="me-2">⚠️</span> {error}
            </div>
          )}

          {/* ================= STEP 1 ================= */}
          {/* (Giữ nguyên cấu trúc Step 1 như bản trước) */}
          {step === 1 && (
             <div className="fade-in">
             <h4 className="fw-bold mb-2 text-white">Chọn đơn hàng cần hỗ trợ</h4>
             <p className="small mb-4" style={{ color: '#a1a1aa' }}>Vui lòng chọn chính xác đơn hàng phần mềm mà bạn đang gặp vấn đề.</p>
             
             {loading ? (
               <div className="text-center py-5">
                 <div className="spinner-border" style={{ color: themeColor }} role="status"><span className="visually-hidden">Loading...</span></div>
               </div>
             ) : products.length === 0 ? (
               <div className="text-center py-5">
                 <p style={{ color: '#aaa' }}>Bạn chưa có sản phẩm nào hợp lệ để tạo ticket.</p>
               </div>
             ) : (
               <>
                 <div className="row g-3 mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${borderColor}` }}>
                   <div className="col-md-7">
                     <div className="d-flex align-items-center rounded" style={{ backgroundColor: inputBg, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
                       <span className="ps-3 pe-2 text-muted">🔍</span>
                       <input
                         type="text"
                         className="form-control shadow-none border-0 bg-transparent text-white py-2"
                         placeholder="Tìm theo tên phần mềm, mã đơn..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                     </div>
                   </div>
                   <div className="col-md-5">
                     <select className="form-select shadow-none py-2" style={customInputStyle} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                       <option value="">📁 Tất cả danh mục</option>
                       {filterCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="row g-3" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '5px' }}>
                   {filteredProducts.map((p, idx) => {
                     const isSelected = selectedProduct?.orderId === p.orderId;
                     return (
                       <div className="col-md-6" key={p.orderId}>
                         <div 
                           onClick={() => setSelectedProduct(p)}
                           className="card h-100 cursor-pointer product-card-hover"
                           style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(242, 101, 34, 0.15)' : inputBg, border: isSelected ? `2px solid ${themeColor}` : `1px solid ${borderColor}`, borderRadius: '12px', transition: 'all 0.2s ease', transform: isSelected ? 'scale(1.02)' : 'none' }}
                         >
                           <div className="card-body d-flex gap-3 align-items-center">
                             <div className="flex-shrink-0">
                               <img src={p.productImage || 'https://via.placeholder.com/64'} alt="Img" className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover', border: `1px solid ${borderColor}` }} />
                             </div>
                             <div style={{ overflow: 'hidden', width: '100%' }}>
                               <h6 className="mb-1 fw-bold text-white text-truncate">{p.productName}</h6>
                               <div className="small mb-1 text-truncate" style={{ color: '#a1a1aa' }}>Shop: <span className="text-light">{p.vendorName}</span></div>
                               
                               {/* NỔI BẬT MÃ ĐƠN & NGÀY MUA ĐỂ DỄ PHÂN BIỆT */}
                               <div className="d-flex justify-content-between align-items-end mt-2">
                                 <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#d4d4d8', fontWeight: 'normal' }}>{getProductCategory(p)}</span>
                                 <div className="text-end">
                                   <div style={{ fontSize: '0.8rem', color: isSelected ? themeColor : '#10b981', fontWeight: 'bold' }}>Mã đơn: #{p.orderId}</div>
                                   <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Ngày mua: {p.purchaseDate}</div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </>
             )}
             <div className="d-flex justify-content-end mt-5 pt-4 border-top" style={{ borderColor: `${borderColor} !important` }}>
               <button onClick={handleNextToStep2} className="btn px-5 py-2 fw-semibold" style={{ backgroundColor: selectedProduct ? themeColor : '#444', color: selectedProduct ? '#fff' : '#888', borderRadius: '8px' }} disabled={!selectedProduct}>
                 Tiếp tục
               </button>
             </div>
           </div>
          )}

          {/* ================= STEP 2: ĐÃ NÂNG CẤP ================= */}
          {step === 2 && (
            <div className="fade-in">
              <h4 className="fw-bold mb-4 text-white">Mô tả chi tiết vấn đề</h4>
              
              <div className="row g-4 mb-4">
                {/* Loại vấn đề */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-light">Loại vấn đề</label>
                  <select 
                    className="form-select shadow-none py-2"
                    style={customInputStyle}
                    value={issueForm.type}
                    onChange={(e) => setIssueForm({...issueForm, type: e.target.value})}
                  >
                    <option value="Bug">Lỗi phần mềm (Software Bug)</option>
                    <option value="Installation">Vấn đề cài đặt (Installation)</option>
                    <option value="License">Lỗi License Key / Kích hoạt</option>
                    <option value="Payment">Vấn đề thanh toán / Giao dịch</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                
                {/* Mức độ ưu tiên (PRIORITY MODULE) */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold text-light">Mức độ ảnh hưởng (Priority)</label>
                  <select 
                    className="form-select shadow-none py-2"
                    style={customInputStyle}
                    value={issueForm.priority}
                    onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}
                  >
                    <option value="Low">🟢 Thấp (Không ảnh hưởng tiến độ)</option>
                    <option value="Normal">🟡 Bình thường (Gặp khó khăn nhưng vẫn dùng được)</option>
                    <option value="High">🔴 Khẩn cấp (Crash ứng dụng, không thể làm việc)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-light">Tiêu đề (Bắt buộc)</label>
                <input 
                  type="text" 
                  className="form-control shadow-none py-2"
                  style={customInputStyle}
                  placeholder="Ví dụ: Lỗi không thể nhập Key kích hoạt trên Windows 11..."
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-light">Mô tả chi tiết (Bắt buộc, tối thiểu 20 ký tự)</label>
                <textarea 
                  rows="5"
                  className="form-control shadow-none py-2"
                  style={customInputStyle}
                  placeholder="- Vấn đề xảy ra khi nào?&#10;- Mã lỗi bạn nhận được là gì?&#10;- Bạn đã thử các bước nào để khắc phục chưa?"
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                ></textarea>
              </div>

              {/* TẢI LÊN ẢNH ĐÍNH KÈM (ATTACHMENT MODULE) */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-light mb-2">Đính kèm ảnh chụp màn hình (Tùy chọn)</label>
                
                {/* Khu vực Drag & Drop giả lập */}
                {!issueForm.file ? (
                  <div 
                    className="p-4 text-center rounded d-flex flex-column align-items-center justify-content-center"
                    style={{ border: `2px dashed ${borderColor}`, backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => fileInputRef.current.click()}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = themeColor}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = borderColor}
                  >
                    <span style={{ fontSize: '2rem', color: '#888' }}>📷</span>
                    <span className="text-light mt-2 fw-semibold">Bấm vào đây để tải ảnh lên</span>
                    <span className="small mt-1" style={{ color: '#888' }}>Hỗ trợ JPG, PNG, GIF (Tối đa 5MB)</span>
                    <input 
                      type="file" 
                      className="d-none" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ backgroundColor: inputBg, border: `1px solid ${themeColor}` }}>
                    <div className="d-flex align-items-center">
                      <span className="me-3" style={{ fontSize: '1.5rem' }}>🖼️</span>
                      <div className="d-flex flex-column">
                        <span className="text-white fw-semibold">{issueForm.file.name}</span>
                        <span className="small" style={{ color: '#aaa' }}>{formatFileSize(issueForm.file.size)}</span>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-danger border-0" onClick={removeFile} title="Xóa file">
                      <span className="fs-5">🗑️</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mt-5 pt-4 border-top" style={{ borderColor: `${borderColor} !important` }}>
                <button onClick={() => setStep(1)} className="btn btn-outline-light px-4 py-2" style={{ borderRadius: '8px' }}>Quay lại</button>
                <button onClick={handleNextToStep3} className="btn px-5 py-2 fw-semibold" style={{ backgroundColor: themeColor, color: '#fff', borderRadius: '8px' }}>Tiếp tục</button>
              </div>
            </div>
          )}

          {/* ================= STEP 3 ================= */}
          {step === 3 && (
            <div className="fade-in">
              <h4 className="fw-bold mb-4 text-white">Kiểm tra & Xác nhận</h4>
              
              <div className="card mb-3 border-0" style={{ backgroundColor: inputBg, borderRadius: '12px' }}>
                <div className="card-header fw-bold text-white border-bottom-0 pt-3 pb-0 d-flex align-items-center" style={{ backgroundColor: 'transparent' }}>
                  <span className="me-2 fs-5">📦</span> Thông tin phần mềm
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <img src={selectedProduct?.productImage || 'https://via.placeholder.com/48'} alt="Product" className="rounded me-3" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                    <div>
                      <h6 className="mb-0 text-white fw-bold">{selectedProduct?.productName}</h6>
                      <small style={{ color: '#a1a1aa' }}>Shop: {selectedProduct?.vendorName} | Mã đơn: <strong className="text-light">#{selectedProduct?.orderId}</strong> | Ngày mua: {selectedProduct?.purchaseDate}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4 border-0" style={{ backgroundColor: inputBg, borderRadius: '12px' }}>
                <div className="card-header fw-bold text-white border-bottom-0 pt-3 pb-0 d-flex align-items-center" style={{ backgroundColor: 'transparent' }}>
                  <span className="me-2 fs-5">📝</span> Chi tiết Ticket
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-sm-6 mb-2 mb-sm-0">
                      <span style={{ color: '#aaa' }}>Phân loại: </span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#eee', fontSize: '0.85rem' }}>{issueForm.type}</span>
                    </div>
                    <div className="col-sm-6">
                      <span style={{ color: '#aaa' }}>Mức độ: </span>
                      <span className="fw-semibold" style={{ color: getPriorityColor(issueForm.priority), fontSize: '0.9rem' }}>
                        {getPriorityLabel(issueForm.priority)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="mb-3" style={{ color: '#aaa' }}>Tiêu đề: <strong className="text-white fs-6">{issueForm.title}</strong></p>
                  
                  <div className="mb-3">
                    <strong className="text-light d-block mb-2">Mô tả lỗi:</strong>
                    <div className="p-3 rounded" style={{ backgroundColor: '#181818', whiteSpace: 'pre-wrap', color: '#d0d0d0', border: `1px solid ${borderColor}`, fontFamily: 'monospace' }}>
                      {issueForm.description}
                    </div>
                  </div>

                  {issueForm.file && (
                    <div>
                      <strong className="text-light d-block mb-2">Ảnh đính kèm:</strong>
                      <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: '#181818', border: `1px solid ${borderColor}`, display: 'inline-flex' }}>
                        <span className="me-2">🖼️</span>
                        <span className="text-white small">{issueForm.file.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-check mb-4 d-flex align-items-center p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${borderColor}` }}>
                <input 
                  className="form-check-input me-3 shadow-none mt-0" 
                  type="checkbox" 
                  id="confirmCheck"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  style={{ width: '22px', height: '22px', cursor: 'pointer', backgroundColor: isConfirmed ? themeColor : 'transparent', borderColor: isConfirmed ? themeColor : '#666' }}
                />
                <label className="form-check-label cursor-pointer" htmlFor="confirmCheck" style={{ color: '#aaa', cursor: 'pointer' }}>
                  Tôi xác nhận các thông tin trên là chính xác (Vendor cam kết phản hồi trong 24h).
                </label>
              </div>

              <div className="d-flex justify-content-between mt-5 pt-4 border-top" style={{ borderColor: `${borderColor} !important` }}>
                <button onClick={() => setStep(2)} className="btn btn-outline-light px-4 py-2" style={{ borderRadius: '8px' }} disabled={isSubmitting}>
                  Quay lại
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={!isConfirmed || isSubmitting}
                  className="btn px-5 py-2 fw-semibold d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: (!isConfirmed || isSubmitting) ? '#444' : themeColor, color: (!isConfirmed || isSubmitting) ? '#888' : '#fff', borderRadius: '8px', border: 'none', transition: 'all 0.3s', minWidth: '160px' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </>
                  ) : 'Gửi Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .product-card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(24, 24, 27, 0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #f97316; }
        input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1; 
        }
      `}} />
    </div>
  );
};

export default CreateSupportTicketWizard;