"use client";

import { ArrowRight, BarChart3, Building2, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "Nguyễn Minh Anh",
    staffId: "SO-0248",
    email: "minhanh@vdagent.vn",
    password: "demo1234",
    role: "Sales Operations",
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    window.localStorage.setItem("vdagent-user", JSON.stringify({
      name: form.name || "Nguyễn Minh Anh",
      email: form.email,
      staffId: form.staffId || "SO-0248",
      role: form.role,
    }));
    window.setTimeout(() => router.push("/"), 450);
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand-lockup"><span className="brand-mark"><BarChart3 /></span><strong>VDAgent</strong></div>
        <div className="story-copy">
          <span className="eyebrow">TRỢ LÝ PHÂN TÍCH CHO SALES</span>
          <h1>Hiểu dữ liệu dự án.<br />Ra quyết định có căn cứ.</h1>
          <p>Sáu agent phối hợp để tìm dữ liệu, so sánh, tạo insight, biểu đồ và báo cáo có thể truy vết.</p>
          <div className="story-points">
            <span><Check /> Phát hiện căn bán chậm theo rule</span>
            <span><Check /> Mọi nhận định đều gắn với evidence</span>
            <span><Check /> Luôn có bước review của nhân viên</span>
          </div>
        </div>
        <div className="auth-stat-card">
          <small>WORKSPACE MẪU</small>
          <strong>Green Avenue · Q2/2026</strong>
          <div><span><b>1.248</b> căn hộ</span><span><b>98,7%</b> chất lượng dữ liệu</span></div>
        </div>
      </section>

      <section className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-brand"><span className="brand-mark"><BarChart3 /></span><strong>VDAgent</strong></div>
          <span className="auth-kicker">DÀNH CHO NHÂN VIÊN BẤT ĐỘNG SẢN</span>
          <h2>{isLogin ? "Chào mừng trở lại" : "Tạo tài khoản làm việc"}</h2>
          <p>{isLogin ? "Đăng nhập để tiếp tục các phiên phân tích của bạn." : "Thiết lập hồ sơ để bắt đầu workspace phân tích."}</p>

          {!isLogin && (
            <div className="field-grid">
              <label className="form-field"><span>Họ và tên</span><span className="input-shell"><UserRound /><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></span></label>
              <label className="form-field"><span>Mã nhân viên</span><span className="input-shell"><Building2 /><input required value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} /></span></label>
            </div>
          )}

          <label className="form-field"><span>Email công việc</span><span className="input-shell"><Mail /><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></span></label>
          <label className="form-field"><span>Mật khẩu</span><span className="input-shell"><LockKeyhole /><input type={showPassword ? "text" : "password"} required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff /> : <Eye />}</button></span></label>

          {!isLogin && (
            <label className="form-field"><span>Vai trò</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Sales Operations</option><option>Chuyên viên kinh doanh</option><option>Sales Manager</option><option>Project Director</option></select></label>
          )}

          {isLogin && <div className="form-options"><label><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div>}

          <button className="primary-auth-button" type="submit" disabled={loading}>{loading ? "Đang mở workspace..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"}<ArrowRight /></button>

          {isLogin && <div className="demo-note"><strong>Tài khoản demo đã được điền sẵn</strong><span>Chỉ cần nhấn “Đăng nhập” để xem toàn bộ luồng mô phỏng.</span></div>}
          <p className="auth-switch">{isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"} <Link href={isLogin ? "/register" : "/login"}>{isLogin ? "Đăng ký" : "Đăng nhập"}</Link></p>
        </form>
      </section>
    </main>
  );
}
