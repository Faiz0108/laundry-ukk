"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaLock, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash, FaExclamationCircle, FaUser, FaUserPlus, FaEnvelope, FaStore, FaPhone, FaCheck } from "react-icons/fa";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [usernameFocused, setUsernameFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Registration state
    const [isRegister, setIsRegister] = useState(false);
    const [regNama, setRegNama] = useState("");
    const [regUsername, setRegUsername] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regTlp, setRegTlp] = useState("");
    const [regOutlet, setRegOutlet] = useState("");
    const [outlets, setOutlets] = useState<{ id: number; nama: string }[]>([]);
    const [regNamaFocused, setRegNamaFocused] = useState(false);
    const [regUsernameFocused, setRegUsernameFocused] = useState(false);
    const [regPasswordFocused, setRegPasswordFocused] = useState(false);
    const [regTlpFocused, setRegTlpFocused] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Fetch outlets for registration
    useEffect(() => {
        const fetchOutlets = async () => {
            const { data } = await supabase.from("tb_outlet").select("id, nama").order("nama");
            if (data) setOutlets(data);
        };
        fetchOutlets();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validasi input kosong
        if (!username.trim()) {
            setError("Pengguna tidak boleh kosong");
            return;
        }
        if (!password.trim()) {
            setError("Kata sandi tidak boleh kosong");
            return;
        }

        setIsLoading(true);

        try {
            // Login dengan Supabase Auth menggunakan email
            const email = username.includes("@") ? username : `${username}@gmail.com`;

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError("Pengguna atau Kata sandi salah");
                setIsLoading(false);
                return;
            }

            // Ambil data user via RPC (bypasses RLS)
            const { data: userRows, error: userError } = await supabase
                .rpc("get_user_by_auth_id", { p_auth_id: authData.user.id });

            if (userError || !userRows || userRows.length === 0) {
                setError("Data user tidak ditemukan di sistem");
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            const userData = userRows[0];

            // Auto-detect role dari database
            const roleDisplayMap: Record<string, string> = { "owner": "Pemilik", "admin": "Admin", "kasir": "Kasir" };
            const displayRole = roleDisplayMap[userData.role] || "Admin";

            // Login berhasil - simpan info user ke localStorage
            localStorage.setItem("user", JSON.stringify({
                id: userData.id,
                username: userData.username,
                nama: userData.nama,
                role: displayRole,
                id_outlet: userData.id_outlet,
                outlet_nama: userData.outlet_nama || "",
                isLoggedIn: true
            }));

            router.push("/beranda");
        } catch {
            setError("Terjadi kesalahan, coba lagi");
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!regNama.trim()) { setError("Nama lengkap tidak boleh kosong"); return; }
        if (!regUsername.trim()) { setError("Pengguna tidak boleh kosong"); return; }
        if (!regPassword.trim()) { setError("Kata sandi tidak boleh kosong"); return; }
        if (regPassword.length < 6) { setError("Kata sandi minimal 6 karakter"); return; }
        if (!regOutlet) { setError("Pilih Toko tempat Anda bekerja"); return; }

        setIsLoading(true);

        try {
            const email = `${regUsername.trim()}@gmail.com`;

            // 1. Create auth user via signUp
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: regPassword,
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    setError("Pengguna sudah terdaftar");
                } else {
                    setError(authError.message);
                }
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                setError("Gagal membuat akun");
                setIsLoading(false);
                return;
            }

            // 2. Insert into tb_user as kasir with outlet and phone
            const { error: insertError } = await supabase.from("tb_user").insert({
                nama: regNama.trim(),
                username: regUsername.trim(),
                role: "kasir",
                auth_id: authData.user.id,
                id_outlet: parseInt(regOutlet),
                tlp: regTlp.trim() || null,
            });

            if (insertError) {
                setError("Gagal menyimpan data user: " + insertError.message);
                setIsLoading(false);
                return;
            }

            // Success
            setSuccessMsg("Registrasi berhasil! Silakan login.");
            setRegNama("");
            setRegUsername("");
            setRegPassword("");
            setRegTlp("");
            setRegOutlet("");
            setTimeout(() => {
                setIsRegister(false);
                setSuccessMsg("");
            }, 2000);
        } catch {
            setError("Terjadi kesalahan, coba lagi");
        }
        setIsLoading(false);
    };

    const inputContainerStyle = {
        position: "relative" as const,
        marginBottom: "24px"
    };

    const inputStyle = (focused: boolean) => ({
        width: "100%",
        padding: "16px 16px 16px 48px",
        paddingRight: "48px",
        border: `2px solid ${focused ? '#14b8a6' : '#e5e7eb'}`,
        borderRadius: "12px",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box" as const,
        backgroundColor: "white",
        transition: "all 0.3s ease",
        boxShadow: focused ? '0 0 0 4px rgba(20, 184, 166, 0.1)' : 'none'
    });

    const labelStyle = (focused: boolean, hasValue: boolean) => ({
        position: "absolute" as const,
        left: "48px",
        top: focused || hasValue ? "-10px" : "50%",
        transform: focused || hasValue ? "none" : "translateY(-50%)",
        fontSize: focused || hasValue ? "12px" : "15px",
        color: focused ? "#14b8a6" : "#9ca3af",
        transition: "all 0.3s ease",
        pointerEvents: "none" as const,
        backgroundColor: "white",
        padding: "0 6px",
        fontWeight: focused || hasValue ? "600" : "400"
    });

    const iconContainerStyle = (focused: boolean) => ({
        position: "absolute" as const,
        left: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        color: focused ? "#14b8a6" : "#9ca3af",
        fontSize: "18px",
        display: "flex",
        transition: "color 0.3s ease"
    });

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #134e4a 100%)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Decorative circles */}
            <div style={{
                position: "absolute",
                top: "-100px",
                left: "-100px",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)"
            }} />
            <div style={{
                position: "absolute",
                bottom: "-150px",
                right: "-150px",
                width: "400px",
                height: "400px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)",
                filter: "blur(60px)"
            }} />

            <div style={{
                backgroundColor: "white",
                borderRadius: "24px",
                padding: "48px 56px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 100px rgba(20, 184, 166, 0.1)",
                position: "relative",
                zIndex: 1
            }}>
                {/* Decorative top border */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "80px",
                    height: "5px",
                    backgroundColor: "#14b8a6",
                    borderRadius: "0 0 50px 50px"
                }} />

                {/* Header */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "40px",
                    textAlign: "center"
                }}>
                    <div style={{
                        width: "72px",
                        height: "72px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(20, 184, 166, 0.3), 0 0 0 8px rgba(20, 184, 166, 0.1)",
                        position: "relative"
                    }}>
                        <span style={{ color: "white", fontSize: "32px", display: "flex" }}>
                            {isRegister ? <FaUserPlus /> : <FaShieldAlt />}
                        </span>
                        {/* Small decorative dot */}
                        <div style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "12px",
                            height: "12px",
                            backgroundColor: "#10b981",
                            borderRadius: "50%",
                            border: "2px solid white"
                        }} />
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: "28px",
                            fontWeight: "700",
                            color: "#1f2937",
                            margin: 0,
                            background: "linear-gradient(135deg, #1f2937 0%, #14b8a6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text"
                        }}>
                            {isRegister ? "Daftar Kasir" : "Laundry System"}
                        </h1>
                        <p style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "8px 0 0 0",
                            fontWeight: "500"
                        }}>
                            {isRegister ? "Buat akun baru sebagai kasir" : "Silakan login untuk mengelola laundry"}
                        </p>
                    </div>
                </div>

                {/* ============ LOGIN FORM ============ */}
                {!isRegister ? (
                    <form onSubmit={handleLogin}>
                        {/* Username */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(usernameFocused, username.length > 0)}>
                                Pengguna
                            </label>
                            <span style={iconContainerStyle(usernameFocused)}><FaUser /></span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setUsernameFocused(true)}
                                onBlur={() => setUsernameFocused(false)}
                                style={inputStyle(usernameFocused)}
                            />
                        </div>

                        {/* Password */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(passwordFocused, password.length > 0)}>
                                Kata Sandi
                            </label>
                            <span style={iconContainerStyle(passwordFocused)}><FaLock /></span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                style={inputStyle(passwordFocused)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    transition: "background-color 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                {showPassword ? (
                                    <span style={{ color: "#14b8a6", fontSize: "18px", display: "flex" }}><FaEyeSlash /></span>
                                ) : (
                                    <span style={{ color: "#9ca3af", fontSize: "18px", display: "flex" }}><FaEye /></span>
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 18px",
                                backgroundColor: "#fef2f2",
                                border: "2px solid #fecaca",
                                borderRadius: "12px",
                                marginBottom: "24px",
                                animation: "shake 0.5s ease"
                            }}>
                                <span style={{ color: "#ef4444", fontSize: "18px", display: "flex", flexShrink: 0 }}><FaExclamationCircle /></span>
                                <span style={{ color: "#dc2626", fontSize: "14px", fontWeight: "500" }}>{error}</span>
                            </div>
                        )}

                        {/* Login Button */}
                        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    padding: "16px 64px",
                                    background: isLoading
                                        ? "linear-gradient(135deg, #99f6e4 0%, #5eead4 100%)"
                                        : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "15px",
                                    fontWeight: "700",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    minWidth: "160px",
                                    boxShadow: isLoading
                                        ? "none"
                                        : "0 10px 25px rgba(20, 184, 166, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)",
                                    transition: "all 0.3s ease",
                                    letterSpacing: "0.5px",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 15px 35px rgba(20, 184, 166, 0.5), 0 6px 16px rgba(0, 0, 0, 0.15)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(20, 184, 166, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                        <span style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "3px solid #ffffff50",
                                            borderTop: "3px solid #ffffff",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite"
                                        }} />
                                        LOADING...
                                    </span>
                                ) : "LOGIN"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* ============ REGISTER FORM ============ */
                    <form onSubmit={handleRegister}>
                        {/* Info Box Tugas Kasir */}
                        <div style={{
                            backgroundColor: "#f0fdfa",
                            border: "1px solid #99f6e4",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            marginBottom: "24px"
                        }}>
                            <p style={{ fontSize: "13px", fontWeight: "700", color: "#0f766e", margin: "0 0 10px 0" }}>
                                📋 Tugas & Fitur Kasir:
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {[
                                    "Registrasi & kelola data pelanggan",
                                    "Entri transaksi laundry (baru, proses, selesai)",
                                    "Generate & cetak laporan transaksi",
                                    "Melihat dashboard aktivitas harian"
                                ].map((task, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ color: "#14b8a6", fontSize: "12px", display: "flex", flexShrink: 0 }}><FaCheck /></span>
                                        <span style={{ fontSize: "12px", color: "#115e59", fontWeight: "500" }}>{task}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nama Lengkap */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(regNamaFocused, regNama.length > 0)}>
                                Nama Lengkap
                            </label>
                            <span style={iconContainerStyle(regNamaFocused)}><FaUser /></span>
                            <input
                                type="text"
                                value={regNama}
                                onChange={(e) => setRegNama(e.target.value)}
                                onFocus={() => setRegNamaFocused(true)}
                                onBlur={() => setRegNamaFocused(false)}
                                style={inputStyle(regNamaFocused)}
                            />
                        </div>

                        {/* Username */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(regUsernameFocused, regUsername.length > 0)}>
                                Pengguna
                            </label>
                            <span style={iconContainerStyle(regUsernameFocused)}><FaEnvelope /></span>
                            <input
                                type="text"
                                value={regUsername}
                                onChange={(e) => setRegUsername(e.target.value)}
                                onFocus={() => setRegUsernameFocused(true)}
                                onBlur={() => setRegUsernameFocused(false)}
                                style={inputStyle(regUsernameFocused)}
                            />
                        </div>

                        {/* Password */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(regPasswordFocused, regPassword.length > 0)}>
                                Kata sandi
                            </label>
                            <span style={iconContainerStyle(regPasswordFocused)}><FaLock /></span>
                            <input
                                type={showRegPassword ? "text" : "password"}
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                onFocus={() => setRegPasswordFocused(true)}
                                onBlur={() => setRegPasswordFocused(false)}
                                style={inputStyle(regPasswordFocused)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    transition: "background-color 0.2s ease"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                                {showRegPassword ? (
                                    <span style={{ color: "#14b8a6", fontSize: "18px", display: "flex" }}><FaEyeSlash /></span>
                                ) : (
                                    <span style={{ color: "#9ca3af", fontSize: "18px", display: "flex" }}><FaEye /></span>
                                )}
                            </button>
                        </div>

                        {/* No. Telepon */}
                        <div style={inputContainerStyle}>
                            <label style={labelStyle(regTlpFocused, regTlp.length > 0)}>
                                No. Telepon (opsional)
                            </label>
                            <span style={iconContainerStyle(regTlpFocused)}><FaPhone /></span>
                            <input
                                type="tel"
                                value={regTlp}
                                onChange={(e) => setRegTlp(e.target.value.replace(/\D/g, ""))}
                                onFocus={() => setRegTlpFocused(true)}
                                onBlur={() => setRegTlpFocused(false)}
                                style={inputStyle(regTlpFocused)}
                            />
                        </div>

                        {/* Pilih Outlet */}
                        <div style={{ marginBottom: "24px", position: "relative" }}>
                            <select
                                value={regOutlet}
                                onChange={(e) => setRegOutlet(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "16px 48px 16px 48px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "12px",
                                    fontSize: "15px",
                                    outline: "none",
                                    appearance: "none",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    boxSizing: "border-box",
                                    transition: "all 0.3s ease",
                                    fontWeight: "500",
                                    color: regOutlet ? "#1f2937" : "#9ca3af"
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "#14b8a6";
                                    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(20, 184, 166, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "#e5e7eb";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <option value="" disabled>Pilih Outlet</option>
                                {outlets.map((outlet) => (
                                    <option key={outlet.id} value={String(outlet.id)}>{outlet.nama}</option>
                                ))}
                            </select>
                            <span style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#9ca3af",
                                fontSize: "18px",
                                display: "flex",
                                pointerEvents: "none"
                            }}>
                                <FaStore />
                            </span>
                            <span style={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#9ca3af",
                                fontSize: "14px",
                                display: "flex",
                                pointerEvents: "none"
                            }}>
                                <FaChevronDown />
                            </span>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 18px",
                                backgroundColor: "#fef2f2",
                                border: "2px solid #fecaca",
                                borderRadius: "12px",
                                marginBottom: "24px",
                                animation: "shake 0.5s ease"
                            }}>
                                <span style={{ color: "#ef4444", fontSize: "18px", display: "flex", flexShrink: 0 }}><FaExclamationCircle /></span>
                                <span style={{ color: "#dc2626", fontSize: "14px", fontWeight: "500" }}>{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMsg && (
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 18px",
                                backgroundColor: "#f0fdf4",
                                border: "2px solid #bbf7d0",
                                borderRadius: "12px",
                                marginBottom: "24px"
                            }}>
                                <span style={{ color: "#16a34a", fontSize: "14px", fontWeight: "500" }}>✓ {successMsg}</span>
                            </div>
                        )}

                        {/* Register Button */}
                        <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    padding: "16px 64px",
                                    background: isLoading
                                        ? "linear-gradient(135deg, #99f6e4 0%, #5eead4 100%)"
                                        : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontSize: "15px",
                                    fontWeight: "700",
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    minWidth: "160px",
                                    boxShadow: isLoading
                                        ? "none"
                                        : "0 10px 25px rgba(20, 184, 166, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)",
                                    transition: "all 0.3s ease",
                                    letterSpacing: "0.5px",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 15px 35px rgba(20, 184, 166, 0.5), 0 6px 16px rgba(0, 0, 0, 0.15)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(20, 184, 166, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }
                                }}
                            >
                                {isLoading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                        <span style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "3px solid #ffffff50",
                                            borderTop: "3px solid #ffffff",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite"
                                        }} />
                                        LOADING...
                                    </span>
                                ) : "DAFTAR"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer with toggle link */}
                <div style={{
                    marginTop: "32px",
                    paddingTop: "24px",
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "center"
                }}>
                    {isRegister && (
                        <p style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            margin: 0,
                            fontWeight: "500"
                        }}>
                             Sudah punya akun? 
                            <button
                                type="button"
                                onClick={() => { setIsRegister(false); setError(""); setSuccessMsg(""); }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#14b8a6",
                                    cursor: "pointer",
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    textDecoration: "underline",
                                    padding: 0
                                }}
                            >
                                Login
                            </button>
                        </p>
                    )}
                    <p style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        margin: "8px 0 0 0",
                        fontWeight: "500"
                    }}>
                        Sistem Manajemen Laundry Professional
                    </p>
                </div>
            </div>

            {/* Add keyframe animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
            `}} />
        </div>
    );
}