import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Sliders,
  SendHorizontal,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Plus,
  Play,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Eye,
  Edit3,
  Server,
  Zap,
  Users,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import {
  NotificationTemplate,
  NotificationDeliveryLog,
  ScheduledBroadcast,
  CommunicationMessage,
  ProviderGatewayConfig,
  NotificationStatistics,
  NotificationChannel,
  NotificationCategory,
} from '../../types/notification';
import { notificationApiService } from '../../services/notificationApiService';

export const CommunicationConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'broadcasts' | 'templates' | 'logs' | 'messenger' | 'scheduler' | 'gateways' | 'reports'
  >('overview');

  // Stats
  const [stats, setStats] = useState<NotificationStatistics | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState<ScheduledBroadcast[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<{
    title: string;
    category: 'ANNOUNCEMENT' | 'MARKETING' | 'POLICY' | 'EMERGENCY';
    channels: NotificationChannel[];
    targetAudience: ScheduledBroadcast['targetAudience'];
    scheduleType: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING';
    scheduledAt: string;
    recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    smsMessage: string;
    emailSubject: string;
    emailMessage: string;
    telegramMessage: string;
    inAppMessage: string;
  }>({
    title: '',
    category: 'ANNOUNCEMENT',
    channels: ['IN_APP', 'SMS'],
    targetAudience: 'ALL_MEMBERS',
    scheduleType: 'IMMEDIATE',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    smsMessage: '',
    emailSubject: '',
    emailMessage: '',
    telegramMessage: '',
    inAppMessage: '',
  });

  // Templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePreview, setTemplatePreview] = useState<any>(null);
  const [testSendChannels, setTestSendChannels] = useState<NotificationChannel[]>(['IN_APP']);
  const [isTestSending, setIsTestSending] = useState(false);
  const [testSendResult, setTestSendResult] = useState<string | null>(null);

  // Delivery Logs
  const [logs, setLogs] = useState<NotificationDeliveryLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logChannelFilter, setLogChannelFilter] = useState('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logCategoryFilter, setLogCategoryFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<NotificationDeliveryLog | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Direct CS Messenger
  const [csMemberId, setCsMemberId] = useState('');
  const [csSubject, setCsSubject] = useState('');
  const [csContent, setCsContent] = useState('');
  const [csChannels, setCsChannels] = useState<NotificationChannel[]>(['IN_APP', 'SMS']);
  const [csHistory, setCsHistory] = useState<CommunicationMessage[]>([]);
  const [isSendingCs, setIsSendingCs] = useState(false);
  const [csSuccess, setCsSuccess] = useState(false);

  // Scheduler
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [isRunningScheduler, setIsRunningScheduler] = useState(false);
  const [schedulerResult, setSchedulerResult] = useState<any>(null);

  // Providers
  const [providers, setProviders] = useState<ProviderGatewayConfig[]>([]);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [providerTestMessage, setProviderTestMessage] = useState<string | null>(null);

  // Reports
  const [selectedReportType, setSelectedReportType] = useState('SMS_DELIVERY_REPORT');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      setIsLoadingStats(true);
      const [st, bcasts, tmpls, provs] = await Promise.all([
        notificationApiService.getStatistics(),
        notificationApiService.getBroadcasts(),
        notificationApiService.getTemplates(),
        notificationApiService.getProviders(),
      ]);
      setStats(st);
      setBroadcasts(bcasts);
      setTemplates(tmpls);
      setProviders(provs);
    } catch (e) {
      console.error('Failed to load notification console data', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await notificationApiService.getDeliveryLogs({
        channel: logChannelFilter !== 'ALL' ? logChannelFilter : undefined,
        status: logStatusFilter !== 'ALL' ? logStatusFilter : undefined,
        category: logCategoryFilter !== 'ALL' ? logCategoryFilter : undefined,
        search: logSearch || undefined,
      });
      setLogs(data.logs);
      setTotalLogs(data.total);
    } catch (e) {
      console.error('Failed to load delivery logs', e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'scheduler') {
      notificationApiService.getSchedulerStatus().then(setSchedulerStatus);
    }
  }, [activeTab, logChannelFilter, logStatusFilter, logCategoryFilter]);

  // Handle Template Preview
  const handleSelectTemplate = async (tmpl: NotificationTemplate) => {
    setSelectedTemplate(tmpl);
    setTestSendResult(null);
    try {
      const prev = await notificationApiService.previewTemplate(tmpl.id, {});
      setTemplatePreview(prev);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Test Send Template
  const handleTestSendTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setIsTestSending(true);
      setTestSendResult(null);
      const res = await notificationApiService.testSendTemplate(selectedTemplate.id, {
        channels: testSendChannels,
      });
      setTestSendResult(`Test dispatch complete! Successfully dispatched to selected channels.`);
      fetchLogs();
    } catch (err: any) {
      setTestSendResult(`Error: ${err.message}`);
    } finally {
      setIsTestSending(false);
    }
  };

  // Handle Create Broadcast
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title.trim()) return;

    try {
      await notificationApiService.createBroadcast({
        ...newBroadcast,
        inAppMessage: newBroadcast.inAppMessage || newBroadcast.smsMessage,
      });
      setIsBroadcastModalOpen(false);
      const updated = await notificationApiService.getBroadcasts();
      setBroadcasts(updated);
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Run Broadcast Now
  const handleRunBroadcastNow = async (id: string) => {
    try {
      await notificationApiService.runBroadcastNow(id);
      const updated = await notificationApiService.getBroadcasts();
      setBroadcasts(updated);
      fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Retry Log
  const handleRetryLog = async (id: string) => {
    try {
      setIsRetrying(true);
      const res = await notificationApiService.retryDeliveryLog(id);
      setRetryMessage(res.message);
      fetchLogs();
      fetchAllData();
      setTimeout(() => setRetryMessage(null), 3000);
    } catch (err: any) {
      setRetryMessage(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle Bulk Retry
  const handleBulkRetry = async () => {
    try {
      setIsRetrying(true);
      const res = await notificationApiService.retryAllFailed();
      setRetryMessage(`Bulk retry complete: ${res.successCount} succeeded, ${res.failCount} failed.`);
      fetchLogs();
      fetchAllData();
      setTimeout(() => setRetryMessage(null), 4000);
    } catch (err: any) {
      setRetryMessage(`Bulk retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle Direct CS Message Send
  const handleSendCsMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csMemberId || !csContent) return;

    try {
      setIsSendingCs(true);
      await notificationApiService.sendDirectMessage({
        memberId: csMemberId,
        subject: csSubject || 'Notice from Wabi SACCO Member Services',
        content: csContent,
        channels: csChannels,
      });
      setCsSuccess(true);
      setCsContent('');
      const hist = await notificationApiService.getCommunicationHistory(csMemberId);
      setCsHistory(hist);
      setTimeout(() => setCsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingCs(false);
    }
  };

  // Handle Load Member History
  const handleLookupMemberHistory = async () => {
    if (!csMemberId) return;
    try {
      const hist = await notificationApiService.getCommunicationHistory(csMemberId);
      setCsHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Run Scheduler
  const handleRunScheduler = async () => {
    try {
      setIsRunningScheduler(true);
      const res = await notificationApiService.runSchedulerReminders();
      setSchedulerResult(res.result);
      fetchAllData();
    } catch (err: any) {
      setSchedulerResult({ errors: [err.message] });
    } finally {
      setIsRunningScheduler(false);
    }
  };

  // Handle Test Provider
  const handleTestProvider = async (id: string) => {
    try {
      setTestingProviderId(id);
      const res = await notificationApiService.testProvider(id);
      setProviderTestMessage(`${res.message}`);
      const provs = await notificationApiService.getProviders();
      setProviders(provs);
      setTimeout(() => setProviderTestMessage(null), 4000);
    } catch (err: any) {
      setProviderTestMessage(`Ping failed: ${err.message}`);
    } finally {
      setTestingProviderId(null);
    }
  };

  // Handle Generate Report
  const handleGenerateReport = async () => {
    try {
      setIsLoadingReport(true);
      const rep = await notificationApiService.getReport(selectedReportType);
      setReportData(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Enterprise Communication & Notification Center</h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                Phase 17 Core
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Centralized orchestration hub for In-App, Ethio Telecom SMS, SMTP Email, and Telegram Bot dispatches.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Broadcast Campaign</span>
          </button>
          <button
            type="button"
            onClick={fetchAllData}
            title="Refresh All"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Cockpit', icon: Layers },
          { id: 'broadcasts', label: 'Campaigns & Broadcasts', icon: Zap },
          { id: 'templates', label: 'Template Studio (35+)', icon: Edit3 },
          { id: 'logs', label: 'Delivery Logs & Retry', icon: Clock },
          { id: 'messenger', label: 'Direct CS Messenger', icon: MessageSquare },
          { id: 'scheduler', label: 'Scheduler & Auto-Reminders', icon: RotateCcw },
          { id: 'gateways', label: 'Gateway Providers', icon: Server },
          { id: 'reports', label: 'Audits & Exports', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE COCKPIT & OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Dispatches</span>
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalDispatched.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{stats.deliveredCount.toLocaleString()} delivered ({stats.deliveryRate}%)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">SMS Volume & Cost</span>
                <Smartphone className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalSmsUnits.toLocaleString()} units</div>
              <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>ETB {stats.totalSmsCostETB.toFixed(2)} billing cost</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Telegram Engagement</span>
                <SendHorizontal className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.telegramDelivered.toLocaleString()}</div>
              <div className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{stats.telegramSubscribers} linked bot subscribers</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Email Deliverability</span>
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.emailSent.toLocaleString()}</div>
              <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero bounce on enterprise SMTP</span>
              </div>
            </div>
          </div>

          {/* Channel Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Multi-Channel Fan-Out Distribution</span>
              </h3>

              <div className="space-y-3.5">
                {[
                  { channel: 'IN_APP', label: 'In-App Notification Center', count: stats.inAppDelivered, color: 'bg-blue-600', icon: Bell },
                  { channel: 'SMS', label: 'Ethio Telecom SMS Gateway', count: stats.totalSmsUnits, color: 'bg-emerald-600', icon: Smartphone },
                  { channel: 'EMAIL', label: 'Enterprise SMTP Server', count: stats.emailSent, color: 'bg-purple-600', icon: Mail },
                  { channel: 'TELEGRAM', label: 'Official Telegram Bot', count: stats.telegramDelivered, color: 'bg-sky-500', icon: SendHorizontal },
                ].map((item) => {
                  const pct = stats.totalDispatched > 0 ? (item.count / stats.totalDispatched) * 100 : 0;
                  const Icon = item.icon;
                  return (
                    <div key={item.channel} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & System Health */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Operational Control & Diagnostics</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRunScheduler}
                  disabled={isRunningScheduler}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Run Auto Reminders</span>
                    <RotateCcw className={`w-4 h-4 text-blue-600 ${isRunningScheduler ? 'animate-spin' : ''}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">Scan savings & loan schedules for due alerts</p>
                </button>

                <button
                  type="button"
                  onClick={handleBulkRetry}
                  disabled={isRetrying}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Retry Failed Queue</span>
                    <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRetrying ? 'animate-spin' : ''}`} />
                  </div>
                  <p className="text-[11px] text-slate-500">Auto-redeliver any undelivered SMS/emails</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('broadcasts')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Broadcast Center</span>
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">{broadcasts.length} campaigns configured</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Template Studio</span>
                    <Edit3 className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">{stats.activeTemplatesCount} active event templates</p>
                </button>
              </div>

              {schedulerResult && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                  <div className="font-bold">Scheduler Execution Summary:</div>
                  <div>• Monthly Savings Reminders: {schedulerResult.monthlySavingRemindersSent}</div>
                  <div>• Upcoming Loan Reminders: {schedulerResult.upcomingLoanRemindersSent}</div>
                  <div>• Overdue Loan Alerts: {schedulerResult.overdueLoanAlertsSent}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS & BROADCASTS */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scheduled Broadcasts & Mass Announcements</h3>
              <p className="text-xs text-slate-500">
                Deliver targeted notices to specific segments (all members, active borrowers, regular savers, etc.).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBroadcastModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Campaign No</th>
                    <th className="px-4 py-3">Title & Category</th>
                    <th className="px-4 py-3">Audience Target</th>
                    <th className="px-4 py-3">Channels</th>
                    <th className="px-4 py-3">Delivery Progress</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{b.broadcastNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] truncate">
                        <div>{b.title}</div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {b.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {b.targetAudience.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {b.channels.map((ch) => (
                            <span key={ch} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                              {ch}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span>{b.successCount}/{b.totalRecipients}</span>
                            <span className="text-emerald-600 font-bold">
                              {b.totalRecipients > 0 ? ((b.successCount / b.totalRecipients) * 100).toFixed(0) : 0}%
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${b.totalRecipients > 0 ? (b.successCount / b.totalRecipients) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {b.scheduleType === 'IMMEDIATE' ? (
                          <span className="text-slate-700 font-semibold">Immediate</span>
                        ) : b.scheduleType === 'RECURRING' ? (
                          <span className="text-purple-700 font-semibold">{b.recurringPattern}</span>
                        ) : (
                          <span>{b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            b.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : b.status === 'RUNNING'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                              : b.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleRunBroadcastNow(b.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                          >
                            Run Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATE STUDIO */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Event Templates ({templates.length})</h3>
                <select
                  value={templateCategoryFilter}
                  onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="LOANS">Loans</option>
                  <option value="SHARES">Shares</option>
                  <option value="MEMBERSHIP">Membership</option>
                  <option value="SYSTEM">System & Security</option>
                  <option value="ACCOUNTING">Accounting</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {templates
                .filter(
                  (t) =>
                    (templateCategoryFilter === 'ALL' || t.category === templateCategoryFilter) &&
                    (!templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.code.toLowerCase().includes(templateSearch.toLowerCase()))
                )
                .map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      selectedTemplate?.id === tmpl.id
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900">{tmpl.name}</div>
                      <div className="font-mono text-[10px] text-blue-600">{tmpl.code}</div>
                      <div className="flex items-center gap-1 pt-1">
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-600 rounded">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] text-slate-400">v{tmpl.version}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                  </button>
                ))}
            </div>
          </div>

          {/* Right Column: Template Inspector & Live Variable Preview */}
          <div className="lg:col-span-7">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedTemplate.name}</h3>
                    <p className="font-mono text-xs text-blue-600">{selectedTemplate.code}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    {selectedTemplate.status}
                  </span>
                </div>

                {/* Variable Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Supported Variables for Variable Injection:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.variables.map((v) => (
                      <span key={v} className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Multi-Channel Preview Tabs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Rendered Channel Previews (Sample Data Injected)
                  </h4>

                  {/* SMS Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ethio Telecom SMS Preview</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {templatePreview?.smsBody?.length || selectedTemplate.smsBody.length} chars (1 SMS unit)
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                      {templatePreview?.smsBody || selectedTemplate.smsBody}
                    </div>
                  </div>

                  {/* Telegram Preview */}
                  <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2">
                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <SendHorizontal className="w-3.5 h-3.5 text-sky-600" />
                      <span>Telegram Bot Message Preview</span>
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-sky-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {templatePreview?.telegramBody || selectedTemplate.telegramBody}
                    </div>
                  </div>

                  {/* In-App Preview */}
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>In-App Alert Header & Body</span>
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-1">
                      <div className="font-bold text-xs text-slate-900">
                        {templatePreview?.title || selectedTemplate.title}
                      </div>
                      <div className="text-xs text-slate-700">
                        {templatePreview?.inAppBody || selectedTemplate.inAppBody || selectedTemplate.smsBody}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Dispatch Tool */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Test Dispatch to Your Account</span>
                    <div className="flex items-center gap-2">
                      {(['IN_APP', 'SMS', 'EMAIL', 'TELEGRAM'] as const).map((ch) => (
                        <label key={ch} className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testSendChannels.includes(ch)}
                            onChange={(e) => {
                              if (e.target.checked) setTestSendChannels([...testSendChannels, ch]);
                              else setTestSendChannels(testSendChannels.filter((c) => c !== ch));
                            }}
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          <span>{ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSendTemplate}
                    disabled={isTestSending || testSendChannels.length === 0}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isTestSending ? 'Sending Test Dispatch...' : 'Execute Test Dispatch 🚀'}
                  </button>

                  {testSendResult && (
                    <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                      {testSendResult}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center bg-white rounded-xl border border-slate-200 space-y-2">
                <Edit3 className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Select an Event Template</h4>
                <p className="text-xs text-slate-500">
                  Select any of the 35+ system event templates on the left to inspect and test dispatch.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY LOGS & RETRY */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Log Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Channels</option>
                <option value="IN_APP">In-App</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="TELEGRAM">Telegram</option>
              </select>

              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="QUEUED">Queued</option>
                <option value="SENDING">Sending</option>
              </select>

              <select
                value={logCategoryFilter}
                onChange={(e) => setLogCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="SAVINGS">Savings</option>
                <option value="LOANS">Loans</option>
                <option value="SHARES">Shares</option>
                <option value="MEMBERSHIP">Membership</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search contact, message..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
              />

              <button
                type="button"
                onClick={handleBulkRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                Bulk Retry Failed
              </button>
            </div>
          </div>

          {retryMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800">
              {retryMessage}
            </div>
          )}

          {/* Delivery Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Recipient & Contact</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Event Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Message Preview</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(l.queuedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{l.recipientName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{l.recipientContact}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {l.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-blue-600 font-semibold">
                        {l.eventCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            l.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : l.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {l.status}
                        </span>
                        {l.retryCount > 0 && (
                          <span className="ml-1 text-[10px] text-slate-400">({l.retryCount} retries)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={l.message}>
                        {l.message}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {l.status === 'FAILED' && (
                          <button
                            type="button"
                            onClick={() => handleRetryLog(l.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DIRECT CUSTOMER SERVICE MESSENGER */}
      {activeTab === 'messenger' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Composer Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Direct Member Messenger</h3>
              <p className="text-xs text-slate-500">
                Send tailored official SMS, In-App, or Telegram messages to a specific member.
              </p>
            </div>

            {csSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Message dispatched successfully!</span>
              </div>
            )}

            <form onSubmit={handleSendCsMessage} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Member ID / Membership No</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WB000001 or mbr_wb000001"
                    value={csMemberId}
                    onChange={(e) => setCsMemberId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleLookupMemberHistory}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Load Thread
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subject / Notice Header</label>
                <input
                  type="text"
                  placeholder="e.g. Inquiry regarding loan application LN-001"
                  value={csSubject}
                  onChange={(e) => setCsSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Type official message..."
                  value={csContent}
                  onChange={(e) => setCsContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Channels:</label>
                <div className="flex items-center gap-3">
                  {(['IN_APP', 'SMS', 'EMAIL', 'TELEGRAM'] as const).map((ch) => (
                    <label key={ch} className="flex items-center gap-1 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setCsChannels([...csChannels, ch]);
                          else setCsChannels(csChannels.filter((c) => c !== ch));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingCs || !csMemberId || !csContent}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingCs ? 'Sending Message...' : 'Send Direct Message 🚀'}
              </button>
            </form>
          </div>

          {/* 360-Degree Thread History */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Communication History Thread</h3>

            {csHistory.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Enter a member ID on the left and click "Load Thread" to view past direct communication records.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {csHistory.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900">{m.subject}</div>
                      <span className="text-[11px] text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{m.content}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 border-t border-slate-200">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      <span>Sent by: <strong>{m.senderName}</strong> ({m.senderRole})</span>
                      <span>• Channels: {m.channels.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SCHEDULER & AUTO REMINDERS */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automated SACCO Scheduled Reminders</h3>
                <p className="text-xs text-slate-500">
                  Background cron jobs that automatically trigger regular savings reminders, loan installment due notices, and overdue late payment alerts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunScheduler}
                disabled={isRunningScheduler}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>Execute Scheduler Now</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Monthly Regular Saving Reminder', freq: 'Every 25th of month', target: 'Savers without deposit', status: 'ACTIVE' },
                { name: 'Upcoming Loan Installment Alert', freq: 'Daily at 08:00 AM', target: 'Due in next 3 days', status: 'ACTIVE' },
                { name: 'Overdue Late Payment Reminder', freq: 'Daily at 09:00 AM', target: 'Overdue installments', status: 'ACTIVE' },
                { name: 'Broadcast Campaign Dispatcher', freq: 'Every 5 minutes', target: 'Pending broadcasts', status: 'RUNNING' },
              ].map((job, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                      {job.status}
                    </span>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{job.name}</h4>
                  <div className="text-[11px] text-slate-500 font-medium">Frequency: {job.freq}</div>
                  <div className="text-[11px] text-slate-400">Target: {job.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: GATEWAYS */}
      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Communication Provider Gateway Management</h3>
            <p className="text-xs text-slate-500">
              Configure primary and fallback delivery channels with live ping tests and health monitoring.
            </p>
          </div>

          {providerTestMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold">
              {providerTestMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((prov) => (
              <div key={prov.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{prov.name}</h4>
                      {prov.isPrimary && (
                        <span className="px-2 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded">
                      Channel: {prov.channel}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      prov.stats.status === 'ONLINE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {prov.stats.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Sent</span>
                    <strong className="font-mono text-slate-800">{prov.stats.totalSent}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Delivered</span>
                    <strong className="font-mono text-emerald-600">{prov.stats.totalSuccess}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Failed</span>
                    <strong className="font-mono text-rose-600">{prov.stats.totalFailed}</strong>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestProvider(prov.id)}
                    disabled={testingProviderId === prov.id}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingProviderId === prov.id ? 'Pinging Gateway...' : 'Ping Gateway Health'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDITS & EXPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Communication Audits & Compliance Exports</h3>
                <p className="text-xs text-slate-500">
                  Generate regulatory audit trails and CSV billing spreadsheets for telecom expenses and notification logs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
                >
                  <option value="SMS_DELIVERY_REPORT">SMS Delivery & Billing Report</option>
                  <option value="EMAIL_DELIVERY_REPORT">Email Deliverability Audit</option>
                  <option value="TELEGRAM_BOT_REPORT">Telegram Bot Alerts Audit</option>
                  <option value="BROADCAST_CAMPAIGN_REPORT">Broadcast Campaign Audit</option>
                  <option value="MASTER_DELIVERY_REPORT">Master Communication Log</option>
                </select>

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Generate Preview
                </button>

                <a
                  href={notificationApiService.getExportReportUrl(selectedReportType)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            {isLoadingReport ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Generating report preview...</p>
              </div>
            ) : reportData?.records ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold">{reportData.reportType}</span>
                  <span>Total Records: <strong className="font-mono">{reportData.records.length}</strong></span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        {Object.keys(reportData.records[0] || {}).map((col) => (
                          <th key={col} className="px-3 py-2 uppercase font-mono text-[10px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.records.slice(0, 50).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {Object.keys(row).map((col) => (
                            <td key={col} className="px-3 py-2 text-slate-700 font-mono text-[11px]">
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Select a report type above and click "Generate Preview" or "Export CSV".
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE BROADCAST MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Broadcast Campaign</h3>
                <p className="text-xs text-slate-500">
                  Send mass announcements, policy updates, or emergency alerts across multiple channels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Annual General Meeting & Dividend Announcement"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Audience Segment</label>
                  <select
                    value={newBroadcast.targetAudience}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="ALL_MEMBERS">All Registered Members</option>
                    <option value="ACTIVE_MEMBERS">Active Members Only</option>
                    <option value="BORROWERS_WITH_ACTIVE_LOANS">Borrowers with Active Loans</option>
                    <option value="SAVERS_REGULAR">Regular Savers</option>
                    <option value="MEMBERS_PENDING_KYC">Members with Pending KYC</option>
                    <option value="STAFF_ALL">All Cooperative Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <select
                    value={newBroadcast.category}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="ANNOUNCEMENT">General Announcement</option>
                    <option value="MARKETING">Marketing & Promotion</option>
                    <option value="POLICY">Policy & Governance Update</option>
                    <option value="EMERGENCY">Emergency Notice (High Priority)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Channels:</label>
                <div className="flex items-center gap-4">
                  {(['IN_APP', 'SMS', 'EMAIL', 'TELEGRAM'] as const).map((ch) => (
                    <label key={ch} className="flex items-center gap-1 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBroadcast.channels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setNewBroadcast({ ...newBroadcast, channels: [...newBroadcast.channels, ch] });
                          else setNewBroadcast({ ...newBroadcast, channels: newBroadcast.channels.filter((c) => c !== ch) });
                        }}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">SMS / In-App Message Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Notice message to send..."
                  value={newBroadcast.smsMessage}
                  onChange={(e) =>
                    setNewBroadcast({
                      ...newBroadcast,
                      smsMessage: e.target.value,
                      inAppMessage: e.target.value,
                      telegramMessage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 text-right">
                  {newBroadcast.smsMessage.length} chars (~{Math.ceil(Math.max(1, newBroadcast.smsMessage.length) / 160)} SMS units)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Schedule Type</label>
                  <select
                    value={newBroadcast.scheduleType}
                    onChange={(e) => setNewBroadcast({ ...newBroadcast, scheduleType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="IMMEDIATE">Dispatch Immediately</option>
                    <option value="SCHEDULED">Schedule for Future Date</option>
                    <option value="RECURRING">Recurring Schedule</option>
                  </select>
                </div>

                {newBroadcast.scheduleType === 'SCHEDULED' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newBroadcast.scheduledAt}
                      onChange={(e) => setNewBroadcast({ ...newBroadcast, scheduledAt: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                )}

                {newBroadcast.scheduleType === 'RECURRING' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Recurrence Frequency</label>
                    <select
                      value={newBroadcast.recurringPattern || 'MONTHLY'}
                      onChange={(e) => setNewBroadcast({ ...newBroadcast, recurringPattern: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
