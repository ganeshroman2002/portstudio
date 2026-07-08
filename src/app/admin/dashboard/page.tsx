"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, FileText, MessageSquare, LogOut, Loader2,
  Search, Trash2, ChevronDown, ChevronUp, User, Briefcase, Crown,
  TrendingUp, Eye, X, Menu, ArrowLeft, Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "users" | "pitches" | "messages";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "talent" | "company">("all");
  const [pitchFilter, setPitchFilter] = useState<"all" | "job_seeker" | "freelancer" | "influencer">("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data");
      if (res.status === 401) {
        router.push("/admin");
        return;
      }
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const handleDeleteUser = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteConfirm(null);
        setSelectedUser(null);
        await fetchData();
      } else {
        alert("Failed to delete: " + (json.error || "Unknown error"));
      }
    } catch {
      alert("Network error while deleting user");
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Filtered & sorted users
  const filteredUsers = useMemo(() => {
    if (!data?.profiles) return [];
    let users = [...data.profiles];

    if (userFilter !== "all") {
      users = users.filter((u: any) =>
        userFilter === "company"
          ? u.account_type === "company"
          : u.account_type !== "company"
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(
        (u: any) =>
          (u.full_name || "").toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q) ||
          (u.headline || "").toLowerCase().includes(q)
      );
    }

    users.sort((a: any, b: any) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      if (sortDir === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return users;
  }, [data?.profiles, userFilter, searchQuery, sortField, sortDir]);

  // Filtered pitches
  const filteredPitches = useMemo(() => {
    if (!data?.pitches) return [];
    let pitches = [...data.pitches];

    if (pitchFilter !== "all") {
      pitches = pitches.filter((p: any) => p.persona_type === pitchFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pitches = pitches.filter(
        (p: any) =>
          (p.full_name || "").toLowerCase().includes(q) ||
          (p.tagline || "").toLowerCase().includes(q) ||
          (p.industry || "").toLowerCase().includes(q)
      );
    }

    return pitches;
  }, [data?.pitches, pitchFilter, searchQuery]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { key: "pitches", label: "Pitches", icon: <FileText className="w-5 h-5" /> },
    { key: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 font-bold text-lg mb-2">Error</p>
          <p className="text-red-300/80 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#0e0e18] border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 pb-3 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight">PortStudio</h2>
            <p className="text-[10px] text-slate-500 font-medium">Admin Panel</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery("");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-500/15 text-indigo-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "users" && data?.stats && (
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                  {data.stats.totalUsers}
                </span>
              )}
              {tab.key === "pitches" && data?.stats && (
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">
                  {data.stats.totalPitches}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-8 py-4 flex items-center gap-4">
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold text-white tracking-tight">
            {tabs.find((t) => t.key === activeTab)?.label}
          </h1>

          {/* Search (for users & pitches tabs) */}
          {(activeTab === "users" || activeTab === "pitches") && (
            <div className="ml-auto relative max-w-xs w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40 transition-all"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "overview" && data?.stats && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: data.stats.totalUsers, icon: <Users className="w-5 h-5" />, color: "indigo", sub: "All registered accounts" },
                  { label: "Talent Users", value: data.stats.talentUsers, icon: <User className="w-5 h-5" />, color: "emerald", sub: "Creators & professionals" },
                  { label: "Companies", value: data.stats.companyUsers, icon: <Briefcase className="w-5 h-5" />, color: "amber", sub: "Business accounts" },
                  { label: "Premium", value: data.stats.premiumUsers, icon: <Crown className="w-5 h-5" />, color: "purple", sub: "Paid subscribers" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      stat.color === "indigo" ? "bg-indigo-500/15 text-indigo-400" :
                      stat.color === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
                      stat.color === "amber" ? "bg-amber-500/15 text-amber-400" :
                      "bg-purple-500/15 text-purple-400"
                    }`}>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                    <p className="text-sm font-bold text-slate-300 mt-1">{stat.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Pitches", value: data.stats.totalPitches, icon: <FileText className="w-5 h-5" /> },
                  { label: "Conversations", value: data.stats.totalConversations, icon: <MessageSquare className="w-5 h-5" /> },
                  { label: "Messages Sent", value: data.stats.totalMessages, icon: <TrendingUp className="w-5 h-5" /> },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-400">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Users */}
              <div className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white">Recent Signups</h3>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {data.profiles.slice(0, 6).map((user: any) => (
                    <div
                      key={user.id}
                      className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { setSelectedUser(user); setActiveTab("users"); }}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                            <User className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.full_name || "Unnamed"}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.username ? `@${user.username}` : "No username"} · {user.account_type || "talent"}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">{formatDate(user.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "talent", "company"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setUserFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      userFilter === f
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {f === "all" ? "All Users" : f === "talent" ? "Talent" : "Companies"}
                  </button>
                ))}

                {/* Mobile search */}
                <div className="sm:hidden relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <span className="ml-auto text-xs text-slate-500 font-medium">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* User Detail Drawer */}
              {selectedUser && (
                <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl p-6 relative">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden shrink-0">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                          <User className="w-7 h-7 text-indigo-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-extrabold text-white">{selectedUser.full_name || "Unnamed"}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {selectedUser.username ? `@${selectedUser.username}` : "No username"} ·{" "}
                        <span className={selectedUser.account_type === "company" ? "text-amber-400" : "text-emerald-400"}>
                          {selectedUser.account_type || "talent"}
                        </span>
                      </p>
                      {selectedUser.headline && (
                        <p className="text-sm text-slate-300 mt-2">{selectedUser.headline}</p>
                      )}
                      {selectedUser.bio && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">{selectedUser.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        {selectedUser.location && <span>📍 {selectedUser.location}</span>}
                        {selectedUser.availability && <span>⏰ {selectedUser.availability}</span>}
                        <span>📊 {selectedUser.profile_views || 0} profile views</span>
                        <span>💎 {selectedUser.subscription_tier || "free"}</span>
                        <span>🕐 Joined {formatDate(selectedUser.created_at)}</span>
                      </div>
                      {selectedUser.skills && selectedUser.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {selectedUser.skills.map((skill: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white/[0.06] text-slate-300 text-[10px] font-bold rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5 pt-4 border-t border-white/[0.06]">
                    <button
                      onClick={() => setDeleteConfirm(selectedUser.id)}
                      className="px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {[
                          { key: "full_name", label: "User" },
                          { key: "account_type", label: "Type" },
                          { key: "subscription_tier", label: "Plan" },
                          { key: "profile_views", label: "Views" },
                          { key: "created_at", label: "Joined" },
                          { key: "_actions", label: "" },
                        ].map((col) => (
                          <th
                            key={col.key}
                            className={`px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                              col.key !== "_actions" ? "cursor-pointer hover:text-slate-300 transition-colors" : ""
                            }`}
                            onClick={() => col.key !== "_actions" && handleSort(col.key)}
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              <SortIcon field={col.key} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredUsers.map((user: any) => (
                        <tr
                          key={user.id}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate max-w-[160px]">{user.full_name || "Unnamed"}</p>
                                <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                  {user.username ? `@${user.username}` : "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                user.account_type === "company"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-emerald-500/15 text-emerald-400"
                              }`}
                            >
                              {user.account_type || "talent"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                user.subscription_tier && user.subscription_tier !== "free"
                                  ? "bg-purple-500/15 text-purple-400"
                                  : "bg-white/[0.04] text-slate-500"
                              }`}
                            >
                              {user.subscription_tier || "free"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-400">{user.profile_views || 0}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{formatDate(user.created_at)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(user);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(user.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-sm">No users found</div>
                )}
              </div>
            </div>
          )}

          {/* ===== PITCHES TAB ===== */}
          {activeTab === "pitches" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "job_seeker", "freelancer", "influencer"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPitchFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      pitchFilter === f
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-slate-200"
                    }`}
                  >
                    {f === "all" ? "All" : f === "job_seeker" ? "Job Seekers" : f === "freelancer" ? "Freelancers" : "Influencers"}
                  </button>
                ))}
                <span className="ml-auto text-xs text-slate-500 font-medium">
                  {filteredPitches.length} pitch{filteredPitches.length !== 1 ? "es" : ""}
                </span>
              </div>

              {/* Pitches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPitches.map((pitch: any) => {
                  const profile = Array.isArray(pitch.profiles) ? pitch.profiles[0] : pitch.profiles;
                  return (
                    <div
                      key={pitch.id}
                      className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-colors group"
                    >
                      {/* Banner */}
                      <div className="h-28 bg-slate-800 relative overflow-hidden">
                        {pitch.cover_banner_url && (
                          <img src={pitch.cover_banner_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" alt="" />
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                            {pitch.persona_type === "job_seeker" ? "Job Seeker" : pitch.persona_type === "freelancer" ? "Freelancer" : "Influencer"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 -mt-6 relative">
                        <div className="flex items-end gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-[#12121a] overflow-hidden shrink-0">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                                <User className="w-5 h-5 text-indigo-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 pb-0.5">
                            <p className="text-sm font-extrabold text-white truncate">{pitch.full_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">@{profile?.username || "user"}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">{pitch.tagline}</p>
                        <div className="flex items-center gap-2 mt-2.5 text-[11px] text-slate-500 font-medium">
                          <span>{pitch.industry}</span>
                          <span>·</span>
                          <span>{pitch.location}</span>
                        </div>
                        {pitch.skills && pitch.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {pitch.skills.slice(0, 3).map((skill: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-white/[0.06] text-slate-400 text-[10px] font-bold rounded">
                                {skill}
                              </span>
                            ))}
                            {pitch.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-white/[0.06] text-slate-500 text-[10px] font-bold rounded">
                                +{pitch.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                          <span className="text-[11px] text-slate-500">{formatDate(pitch.created_at)}</span>
                          <div className="flex items-center gap-2 text-xs">
                            {pitch.persona_type === "job_seeker" && pitch.expected_salary && (
                              <span className="text-indigo-400 font-bold">₹{Number(pitch.expected_salary).toLocaleString()}/mo</span>
                            )}
                            {pitch.persona_type === "freelancer" && pitch.hourly_rate && (
                              <span className="text-indigo-400 font-bold">₹{Number(pitch.hourly_rate).toLocaleString()}/hr</span>
                            )}
                            {pitch.persona_type === "influencer" && pitch.rate_per_post && (
                              <span className="text-indigo-400 font-bold">₹{Number(pitch.rate_per_post).toLocaleString()}/post</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredPitches.length === 0 && (
                <div className="p-12 text-center text-slate-500 text-sm bg-[#12121a]/80 border border-white/[0.06] rounded-2xl">
                  No pitches found
                </div>
              )}
            </div>
          )}

          {/* ===== MESSAGES TAB ===== */}
          {activeTab === "messages" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white">{data?.stats.totalConversations || 0}</p>
                  <p className="text-sm text-slate-400 font-bold mt-1">Total Conversations</p>
                  <p className="text-xs text-slate-500 mt-0.5">Active threads between users</p>
                </div>
                <div className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-white">{data?.stats.totalMessages || 0}</p>
                  <p className="text-sm text-slate-400 font-bold mt-1">Messages Sent</p>
                  <p className="text-xs text-slate-500 mt-0.5">Recent 100 messages loaded</p>
                </div>
              </div>

              {/* Recent Messages */}
              <div className="bg-[#12121a]/80 border border-white/[0.06] rounded-2xl">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-extrabold text-white">Recent Messages</h3>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
                  {(data?.messages || []).slice(0, 20).map((msg: any) => {
                    const sender = data.profiles.find((p: any) => p.id === msg.sender_id);
                    return (
                      <div key={msg.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0 mt-0.5">
                          {sender?.avatar_url ? (
                            <img src={sender.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{sender?.full_name || "Unknown"}</p>
                            <span className="text-[11px] text-slate-500">{formatDate(msg.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{msg.content}</p>
                        </div>
                        {msg.read_at ? (
                          <span className="text-[10px] text-emerald-400 font-bold shrink-0 mt-1">Read</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold shrink-0 mt-1">Unread</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(!data?.messages || data.messages.length === 0) && (
                  <div className="p-12 text-center text-slate-500 text-sm">No messages yet</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#16161f] border border-white/[0.08] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-extrabold text-white text-center mb-2">Delete User</h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              This will permanently delete this user and all their data (portfolios, pitches, messages). This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-xl text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
