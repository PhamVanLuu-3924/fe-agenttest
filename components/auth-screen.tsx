"use client";
// Keep Figma's intrinsic SVG dimensions for the glow layers and small star details.
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createMockSession } from "@/app/session-adapter";
import type { UserProfile } from "@/types/workspace";
import styles from "./auth-screen.module.css";

const benefits = [
  "Phát hiện cơ hội giao dịch thực tế",
  "Dữ liệu dự án và giá cập nhật sát thời gian thực",
  "Theo dõi quy trình bán hàng tập trung",
];

const backgroundLayers = [
  ["glowIndigo", "glow-indigo"], ["glowCobalt", "glow-cobalt"], ["glowBlue", "glow-blue"],
  ["glowPurpleTop", "glow-purple-top"], ["glowPurpleBridge", "glow-purple-bridge"],
  ["glowTeal", "glow-teal"], ["glowCyan", "glow-cyan"], ["glowPink", "glow-pink"],
];

export function AuthScreen({ mode, reason }: { mode: "login" | "register"; reason?: string }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [loading, setLoading] = useState(false);
  const remember = true;
  const [consent, setConsent] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", staffId: "", department: "", email: "", password: "", role: "Sales Operations" });

  const notice = reason === "expired" ? "Phiên làm việc đã hết hạn. Đăng nhập lại để tiếp tục."
    : reason === "denied" ? "Tài khoản demo chưa được cấp quyền vào workspace."
      : reason === "inactive" ? "Tài khoản hiện không hoạt động. Liên hệ quản trị viên để được hỗ trợ."
        : "";

  function enterWorkspace(user: UserProfile) {
    const result = createMockSession(user, remember);
    if (result.status === "authenticated") {
      setMessage("");
      setLoading(true);
      window.setTimeout(() => router.push("/"), 350);
      return;
    }
    setLoading(false);
    setMessage(result.status === "denied" ? "Không có quyền truy cập workspace demo." : "Tài khoản chưa hoạt động. Liên hệ quản trị viên.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = form.email.trim();
    if (!email || !form.password.trim()) {
      setMessage("Nhập email công việc và mật khẩu để tiếp tục.");
      return;
    }
    const emailName = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    const fallbackName = emailName.split(" ").map((part) => part.charAt(0).toLocaleUpperCase("vi-VN") + part.slice(1)).join(" ");
    enterWorkspace({
      name: form.name.trim() || fallbackName || "Nguyễn Minh Anh",
      email,
      staffId: form.staffId.trim() || "SO-0248",
      role: isLogin ? form.role : form.department.trim() || "Kinh doanh",
    });
  }

  function useDemoSso() {
    enterWorkspace({ name: "Nguyễn Minh Anh", email: "minhanh@vdagent.vn", staffId: "SO-0248", role: "Sales Operations" });
  }

  return (
    <main className={styles.page}>
      <div className={styles.aurora} aria-hidden="true">
        {backgroundLayers.map(([className, assetName]) => <span key={className} className={`${styles.glow} ${styles[className]}`}><img src={`/assets/figma/auth/${assetName}.svg`} alt="" /></span>)}
        {Array.from({ length: 14 }, (_, index) => {
          const assetNumber = index === 12 ? 2 : index === 13 ? 13 : index + 1;
          return <img key={index} className={styles[`star${index + 1}`]} src={`/assets/figma/auth/star-${String(assetNumber).padStart(2, "0")}.svg`} alt="" />;
        })}
      </div>

      <section className={styles.brandPanel} aria-label="Giới thiệu VDAgent">
        <Link className={styles.brand} href="/login">VDAgent</Link>
        <div className={styles.brandCopy}>
          <span className={styles.eyebrow}>TRỢ LÝ PHÂN TÍCH CHO SALES</span>
          <h1>Hiểu dữ liệu dự án.<br />Ra quyết định có căn cứ.</h1>
          <p>VDAgent giúp bạn tìm kiếm, so sánh dữ liệu dự án và nhận diện cơ hội giao dịch nhanh hơn.</p>
          <ul className={styles.benefits}>{benefits.map((benefit, index) => <li key={benefit}><span className={index < 2 ? styles.check : styles.bullet}>{index < 2 && <img src={`/assets/figma/auth/check-0${index + 1}.svg`} alt="" />}</span>{benefit}</li>)}</ul>
        </div>
      </section>

      <section className={styles.formPanel} aria-label={isLogin ? "Đăng nhập" : "Đăng ký"}>
        <form className={`${styles.card} ${isLogin ? "" : styles.cardRegister}`} autoComplete="off" onSubmit={submit}>
          <div className={styles.mobileBrand}>VDAgent</div>
          <span className={styles.formEyebrow}>{"B\u1ea2O M\u1eacT T\u00c0I KHO\u1ea2N"}</span>
          <h2>{isLogin ? <><span>Chào mừng</span><em>trở lại</em></> : <><span>Tạo tài khoản</span><em>nhân viên</em></>}</h2>
          <p className={styles.subtitle}>{isLogin ? "\u0110\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c phi\u00ean ph\u00e2n t\u00edch c\u00f3 b\u1eb1ng ch\u1ee9ng." : "D\u00e0nh cho ng\u01b0\u1eddi d\u00f9ng thu\u1ed9c \u0111\u01a1n v\u1ecb \u0111\u00e3 \u0111\u01b0\u1ee3c ph\u00ea duy\u1ec7t."}</p>

          {notice && <p className={styles.notice} role="status">{notice}</p>}
          {message && <p className={styles.error} role="alert">{message}</p>}

          {!isLogin && <div className={styles.registerFields}>
            <label className={styles.field}><span>{"H\u1ecd v\u00e0 t\u00ean"}</span><input autoComplete="name" placeholder={"Nguy\u1ec5n Minh Anh"} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className={styles.field}><span>{"Email c\u00f4ng vi\u1ec7c"}</span><input type="email" autoComplete="off" inputMode="email" placeholder="name@company.vn" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className={styles.field}><span>{"M\u00e3 nh\u00e2n vi\u00ean"}</span><input autoComplete="off" placeholder="VD-0248" required value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })} /></label>
            <label className={styles.field}><span>{"Ph\u00f2ng ban"}</span><input autoComplete="organization-title" placeholder="Kinh doanh" required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
            <label className={styles.field}><span>{"M\u1eadt kh\u1ea9u"}</span><input type="password" autoComplete="new-password" placeholder={"T\u1ed1i thi\u1ec3u 10 k\u00fd t\u1ef1"} minLength={10} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          </div>}

          {isLogin && <div className={styles.loginFields}>
            <label className={styles.field}><span>{"Email c\u00f4ng vi\u1ec7c"}</span><input type="email" autoComplete="off" inputMode="email" placeholder="name@company.vn" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className={styles.field}><span>{"M\u1eadt kh\u1ea9u"}</span><input type="password" autoComplete="off" placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"} minLength={6} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          </div>}


          {isLogin && <button className={styles.forgotPassword} type="button" onClick={() => setMessage("Li\u00ean h\u1ec7 qu\u1ea3n tr\u1ecb vi\u00ean \u0111\u1ec3 \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u t\u00e0i kho\u1ea3n demo.")}>{"Qu\u00ean m\u1eadt kh\u1ea9u?"}</button>}
          {!isLogin && <label className={styles.consent}><input type="checkbox" checked={consent} required onChange={(event) => setConsent(event.target.checked)} /><span>{"B\u1eb1ng c\u00e1ch ti\u1ebfp t\u1ee5c, b\u1ea1n \u0111\u1ed3ng \u00fd v\u1edbi quy \u0111\u1ecbnh s\u1eed d\u1ee5ng d\u1eef li\u1ec7u."}</span></label>}
          <button className={styles.primaryButton} type="submit" disabled={loading}>{loading ? "\u0110ang m\u1edf workspace\u2026" : isLogin ? "\u0110\u0103ng nh\u1eadp" : "T\u1ea1o t\u00e0i kho\u1ea3n"}</button>

          <div className={styles.divider}><span>{"ho\u1eb7c"}</span></div>
          <button className={styles.microsoftButton} type="button" onClick={useDemoSso}><span className={styles.microsoftMark} aria-hidden="true"><i /><i /><i /><i /></span>{isLogin ? "Ti\u1ebfp t\u1ee5c v\u1edbi Microsoft" : "\u0110\u0103ng k\u00fd v\u1edbi Microsoft"}</button>
          <small className={styles.policy}>{"D\u1eef li\u1ec7u \u0111\u0103ng nh\u1eadp \u0111\u01b0\u1ee3c b\u1ea3o v\u1ec7 theo ch\u00ednh s\u00e1ch n\u1ed9i b\u1ed9."}</small>

        </form>
      </section>
    </main>
  );
}
