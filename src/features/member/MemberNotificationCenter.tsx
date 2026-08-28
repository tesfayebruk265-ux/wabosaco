import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  Send,
  Sliders,
  SendHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Archive,
  Trash2,
  Clock,
  Shield,
  Smartphone,
  Mail,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import {
  InAppNotification,
  NotificationPreference,
  CommunicationMessage,
  NotificationCategory,
} from '../../types/notification';
import { notificationApiService } from '../../services/notificationApiService';

export const MemberNotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'preferences' | 'telegram' | 'messages'>('inbox');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState<InAppNotification | null>(null);

  // Preferences State
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // Telegram Linking State
  const [telegramTokenInfo, setTelegramTokenInfo] = useState<{ token: string; botUsername: string; deepLink: string; expiresAt: string } | null>(null);
  const [telegramInputChatId, setTelegramInputChatId] = useState('');
  const [telegramInputUsername, setTelegramInputUsername] = useState('');
  const [telegramInputToken, setTelegramInputToken] = useState('');
  const [isVerifyingTelegram, setIsVerifyingTelegram] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Customer Service Messages State
  const [csMessages, setCsMessages] = useState<CommunicationMessage[]>([]);
  const [isLoadingCs, setIsLoadingCs] = useState(false);

  // Fetch In-App Notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationApiService.getMyNotifications({
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter,
        search: searchQuery || undefined,
      });
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Preferences
  const fetchPreferences = async () => {
    try {
      const prefs = await notificationApiService.getPreferences();
      setPreferences(prefs);
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  };

  // Fetch CS Messages
  const fetchCsMessages = async () => {
    try {
      setIsLoadingCs(true);
      const messages = await notificationApiService.getAllCommunicationMessages();
      setCsMessages(Array.isArray(messages) ? messages : []);
    } catch (e) {
      console.error('Failed to load communication messages', e);
    } finally {
      setIsLoadingCs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchNotifications();
    } else if (activeTab === 'preferences') {
      fetchPreferences();
    } else if (activeTab === 'telegram') {
      fetchPreferences();
    } else if (activeTab === 'messages') {
      fetchCsMessages();
    }
  }, [activeTab, statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await notificationApiService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationApiService.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleArchive = async (id: string) => {
    await notificationApiService.archiveNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDelete = async (id: string) => {
    await notificationApiService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    try {
      setIsSavingPrefs(true);
      await notificationApiService.updatePreferences(preferences);
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleGenerateTelegramCode = async () => {
    try {
      const res = await notificationApiService.generateTelegramToken();
      setTelegramTokenInfo(res);
      setTelegramInputToken(res.token);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramInputToken || !telegramInputChatId) {
      setTelegramMessage({ text: 'Please enter both the OTP Token and your Telegram Chat ID', type: 'error' });
      return;
    }

    try {
      setIsVerifyingTelegram(true);
      const res = await notificationApiService.verifyTelegramChat(
        telegramInputToken,
        telegramInputChatId,
        telegramInputUsername
      );
      setPreferences(res.preferences);
      setTelegramMessage({ text: 'Telegram connected and verified successfully!', type: 'success' });
    } catch (err: any) {
      setTelegramMessage({ text: err.message || 'Verification failed', type: 'error' });
    } finally {
      setIsVerifyingTelegram(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      const res = await notificationApiService.unlinkTelegram();
      setPreferences(res.preferences);
      setTelegramTokenInfo(null);
      setTelegramMessage({ text: 'Telegram account unlinked.', type: 'success' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestSendTelegram = async () => {
    try {
      const res = await notificationApiService.testSendTelegram();
      setTelegramMessage({ text: res.message || 'Test message dispatched to Telegram!', type: 'success' });
    } catch (e: any) {
      setTelegramMessage({ text: e.message || 'Test send failed', type: 'error' });
    }
  };

  const getCategoryBadgeColor = (cat?: NotificationCategory) => {
    switch (cat) {
      case 'SAVINGS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOANS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SHARES':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MEMBERSHIP':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SYSTEM':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Member Communication Hub</h1>
              <p className="text-sm text-slate-500">
                Manage your real-time transaction alerts, multi-channel preferences, and Telegram notifications.
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && activeTab === 'inbox' && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'inbox'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Inbox</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Channel Preferences & Quiet Hours</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'telegram'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <SendHorizontal className="w-4 h-4 text-sky-500" />
          <span>Telegram Bot Connection</span>
          {preferences?.telegramVerified ? (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
              Not Linked
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'messages'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Service Messages</span>
        </button>
      </div>

      {/* TAB 1: NOTIFICATION INBOX */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Controls Bar: Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'UNREAD', 'READ', 'ARCHIVED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Alerts' : st === 'UNREAD' ? 'Unread Only' : st === 'READ' ? 'Read' : 'Archived'}
                </button>
              ))}
            </div>

            {/* Category Filter & Search */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="SAVINGS">Savings</option>
                <option value="LOANS">Loans</option>
                <option value="SHARES">Shares</option>
                <option value="MEMBERSHIP">Membership</option>
                <option value="SYSTEM">Security & System</option>
                <option value="MARKETING">Announcements</option>
              </select>

              <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            </div>
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Loading alerts...</p>
            </div>
          ) : (notifications || []).length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                You're all caught up! When transactions, loan updates, or announcements occur, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !n.isRead
                      ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      {getTypeIcon(n.type)}
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </h4>
                          {n.category && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getCategoryBadgeColor(n.category)}`}>
                              {n.category}
                            </span>
                          )}
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(n.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {n.eventType && <span>• Event: {n.eventType}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-start">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          title="Mark as Read"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleArchive(n.id)}
                        title="Archive"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHANNEL PREFERENCES & QUIET HOURS */}
      {activeTab === 'preferences' && preferences && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Communication Delivery Channels</h2>
              <p className="text-xs text-slate-500">
                Choose which channels you want Wabi SACCO to deliver your account alerts and statements to.
              </p>
            </div>
            {prefSaveSuccess && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          {/* Primary Channel Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-bold text-slate-800">In-App Inbox</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.channelsEnabled.inApp}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      channelsEnabled: { ...preferences.channelsEnabled, inApp: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500">Always accessible inside your web portal dashboard.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800">SMS Alerts</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.channelsEnabled.sms}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      channelsEnabled: { ...preferences.channelsEnabled, sms: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500">Instant SMS via Ethio Telecom for transactions and OTPs.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-bold text-slate-800">Email Reports</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.channelsEnabled.email}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      channelsEnabled: { ...preferences.channelsEnabled, email: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-500">Formal PDF statements, passbook receipts, and tax notices.</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SendHorizontal className="w-5 h-5 text-sky-500" />
                  <span className="text-sm font-bold text-slate-800">Telegram Bot</span>
                </div>
                <input
                  type="checkbox"
                  disabled={!preferences.telegramVerified}
                  checked={preferences.channelsEnabled.telegram && !!preferences.telegramVerified}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      channelsEnabled: { ...preferences.channelsEnabled, telegram: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-slate-500">
                {preferences.telegramVerified
                  ? 'Active and linked to @WabiSaccoAlertsBot.'
                  : 'Link your Telegram Chat ID in the Telegram tab first.'}
              </p>
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Quiet Hours Protection</h3>
                  <p className="text-xs text-amber-800">
                    Pause marketing & non-urgent SMS alerts during resting hours (East Africa Time, UTC+3). Emergency & security alerts will still pass through.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, quietHoursEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>

            {preferences.quietHoursEnabled && (
              <div className="flex items-center gap-4 pt-2 border-t border-amber-200/60">
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">Silence From:</label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) =>
                      setPreferences({ ...preferences, quietHoursStart: e.target.value })
                    }
                    className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">Resume At:</label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) =>
                      setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                    }
                    className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Language Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Preferred Notice Language</label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value as any })
              }
              className="w-full md:w-64 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English (Official SACCO)</option>
              <option value="am">አማርኛ (Amharic)</option>
              <option value="om">Afaan Oromoo</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingPrefs}
              onClick={handleSavePreferences}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingPrefs ? 'Saving Preferences...' : 'Save Channel Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TELEGRAM BOT INTEGRATION */}
      {activeTab === 'telegram' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Wabi SACCO Telegram Alerts Bot</h2>
            <p className="text-xs text-slate-500">
              Receive lightning-fast, zero-cost push notifications on Telegram directly to your phone or desktop.
            </p>
          </div>

          {telegramMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                telegramMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                {telegramMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{telegramMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setTelegramMessage(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {preferences?.telegramVerified ? (
            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">Telegram Connected & Verified</h3>
                    <p className="text-xs text-emerald-800">
                      Linked Chat ID: <span className="font-mono font-bold">{preferences.telegramChatId}</span>{' '}
                      {preferences.telegramUsername && `(${preferences.telegramUsername})`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSendTelegram}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Send Test Alert 🚀
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlinkTelegram}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step by Step Guide */}
              <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Step-by-Step Connection Instructions</span>
                </h3>

                <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
                  <li>
                    Click <span className="font-semibold text-slate-800">"Generate Link Code"</span> below to receive a secure 6-digit OTP.
                  </li>
                  <li>
                    Open Telegram and search for{' '}
                    <span className="font-mono font-bold text-blue-600">@WabiSaccoAlertsBot</span> or click the deep link button.
                  </li>
                  <li>
                    Send <span className="font-mono font-bold text-slate-800">/start</span> to the bot.
                  </li>
                  <li>
                    Copy your <span className="font-semibold text-slate-800">Telegram Chat ID</span> and enter it in the form to finalize verification.
                  </li>
                </ol>

                <div className="pt-2">
                  {!telegramTokenInfo ? (
                    <button
                      type="button"
                      onClick={handleGenerateTelegramCode}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      Generate Link Code & Deep Link
                    </button>
                  ) : (
                    <div className="space-y-3 bg-white p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your One-Time Code:</span>
                        <div className="flex items-center gap-1.5 font-mono text-base font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <span>{telegramTokenInfo.token}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(telegramTokenInfo.token);
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                            }}
                            className="text-blue-500 hover:text-blue-700 cursor-pointer"
                          >
                            {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <a
                        href={telegramTokenInfo.deepLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                      >
                        <SendHorizontal className="w-4 h-4" />
                        <span>Open @{telegramTokenInfo.botUsername} in Telegram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyTelegram} className="space-y-4 p-5 bg-white rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Verify & Link Account</h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Verification OTP Token</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={telegramInputToken}
                    onChange={(e) => setTelegramInputToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Telegram Chat ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 192847291"
                    value={telegramInputChatId}
                    onChange={(e) => setTelegramInputChatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Telegram Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="@yourusername"
                    value={telegramInputUsername}
                    onChange={(e) => setTelegramInputUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingTelegram}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingTelegram ? 'Verifying Telegram Link...' : 'Complete Telegram Verification'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CUSTOMER SERVICE MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Direct Customer Service Communications</h2>
            <p className="text-xs text-slate-500">
              Official 1-on-1 messages, inquiry replies, and notices sent directly from Wabi SACCO staff.
            </p>
          </div>

          {isLoadingCs ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading messages...</p>
            </div>
          ) : (csMessages || []).length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Direct Messages</h4>
              <p className="text-xs text-slate-500">
                You have no direct customer service message threads at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {csMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{msg.subject}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded border border-blue-200">
                        {msg.senderRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-200/60">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sent by: <strong className="text-slate-700">{msg.senderName}</strong></span>
                    <span>• Channels: {msg.channels.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
