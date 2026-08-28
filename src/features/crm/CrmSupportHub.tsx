import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  User,
  Shield,
  ArrowUpRight,
  BookOpen,
  Headphones,
  Sliders,
  ChevronRight,
  Eye,
  Paperclip,
  Star,
  Users,
  RefreshCw,
  FileText,
  Lock,
  PieChart,
  Landmark,
  Wallet,
  TrendingUp,
  AlertCircle,
  CornerDownRight,
  GitMerge,
  ThumbsUp,
  ThumbsDown,
  Building,
  Check,
  Tag,
  Share2,
} from 'lucide-react';
import { crmService } from '../../services/crmService';
import {
  SupportTicket,
  TicketMessage,
  SlaPolicy,
  KnowledgeBaseArticle,
  ChatSession,
  ChatMessage,
  Member360Profile,
  CrmDashboardMetrics,
  AgentPerformanceMetric,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketStatus,
} from '../../types/crm';
import { useToast } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';

export const CrmSupportHub: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    toast[type](type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Attention' : 'Notice', message);
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<'tickets' | 'member360' | 'chat' | 'kb' | 'sla'>('tickets');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<CrmDashboardMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceMetric[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);

  // Active Ticket Details Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Escalation & Resolution & Merge States
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [escalateReason, setEscalateReason] = useState<string>('');
  const [escalateLevel, setEscalateLevel] = useState<number>(1);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [secondaryMergeId, setSecondaryMergeId] = useState<string>('');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newSubject, setNewSubject] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('GENERAL_INQUIRY');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDepartment, setNewDepartment] = useState<TicketDepartment>('CUSTOMER_SERVICE');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');

  // Member 360 State
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>('WB000001');
  const [member360, setMember360] = useState<Member360Profile | null>(null);
  const [loading360, setLoading360] = useState<boolean>(false);

  // Live Chat State
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // KB Editor State
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [showArticleModal, setShowArticleModal] = useState<boolean>(false);
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [articleCategory, setArticleCategory] = useState<string>('Savings');
  const [articleContent, setArticleContent] = useState<string>('');
  const [articleTags, setArticleTags] = useState<string>('');

  // Fetch Core CRM Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketRes, metricsRes, slaRes, kbRes, chatRes] = await Promise.all([
        crmService.getTickets(),
        crmService.getDashboardMetrics(),
        crmService.getSlaPolicies(),
        crmService.getKbArticles(),
        crmService.getChatSessions(),
      ]);

      if (ticketRes.success) setTickets(ticketRes.tickets);
      if (metricsRes.success) {
        setDashboardMetrics(metricsRes.metrics);
        setAgentPerformance(metricsRes.agentPerformance);
      }
      if (slaRes.success) setSlaPolicies(slaRes.policies);
      if (kbRes.success) setKbArticles(kbRes.articles);
      if (chatRes.success) setChatSessions(chatRes.sessions);
    } catch (err: any) {
      showToast(err.message || 'Error loading CRM data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Single Ticket Details & Messages
  const openTicketDetails = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      setLoadingMessages(true);
      const res = await crmService.getTicketById(ticket.id);
      if (res.success) {
        setSelectedTicket(res.ticket);
        setTicketMessages(res.messages);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load ticket conversation', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Submit Reply or Internal Staff Note
  const handleSendMessage = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await crmService.addMessage(selectedTicket.id, {
        content: replyText.trim(),
        isInternalNote,
      });
      if (res.success) {
        setTicketMessages((prev) => [...prev, res.data]);
        setSelectedTicket(res.ticket);
        setReplyText('');
        showToast(isInternalNote ? 'Internal note recorded' : 'Reply sent to member', 'success');
        // Refresh ticket list in background
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error posting message', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await crmService.updateTicket(selectedTicket.id, { status: newStatus });
      if (res.success) {
        setSelectedTicket(res.ticket);
        showToast(`Ticket moved to ${newStatus}`, 'success');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Handle Ticket Escalation
  const handleEscalateSubmit = async () => {
    if (!selectedTicket) return;
    try {
      const res = await crmService.escalateTicket(selectedTicket.id, {
        level: escalateLevel,
        reason: escalateReason,
      });
      if (res.success) {
        setSelectedTicket(res.ticket);
        setShowEscalateModal(false);
        setEscalateReason('');
        showToast(`Ticket escalated to Level ${escalateLevel}`, 'warning');
        openTicketDetails(res.ticket);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to escalate ticket', 'error');
    }
  };

  // Handle Ticket Resolution
  const handleResolveSubmit = async () => {
    if (!selectedTicket) return;
    try {
      const res = await crmService.updateTicket(selectedTicket.id, {
        status: 'RESOLVED',
        resolution: resolutionText,
      });
      if (res.success) {
        setSelectedTicket(res.ticket);
        setShowResolveModal(false);
        setResolutionText('');
        showToast('Ticket marked as RESOLVED and resolution notes posted', 'success');
        openTicketDetails(res.ticket);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve ticket', 'error');
    }
  };

  // Handle Ticket Reopen
  const handleReopen = async () => {
    if (!selectedTicket) return;
    try {
      const res = await crmService.reopenTicket(selectedTicket.id, 'Reopened by staff for further investigation');
      if (res.success) {
        setSelectedTicket(res.ticket);
        showToast('Ticket reopened', 'info');
        openTicketDetails(res.ticket);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen ticket', 'error');
    }
  };

  // Handle Merge Tickets
  const handleMergeSubmit = async () => {
    if (!selectedTicket || !secondaryMergeId.trim()) return;
    try {
      const res = await crmService.mergeTickets(selectedTicket.id, [secondaryMergeId.trim()]);
      if (res.success) {
        setSelectedTicket(res.ticket);
        setShowMergeModal(false);
        setSecondaryMergeId('');
        showToast(res.message, 'success');
        openTicketDetails(res.ticket);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to merge tickets', 'error');
    }
  };

  // Handle Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('Subject and description are required', 'warning');
      return;
    }

    try {
      const res = await crmService.createTicket({
        memberId: newMemberId.trim() || undefined,
        category: newCategory,
        priority: newPriority,
        department: newDepartment,
        subject: newSubject.trim(),
        description: newDescription.trim(),
      });

      if (res.success) {
        showToast(res.message, 'success');
        setShowCreateModal(false);
        setNewSubject('');
        setNewDescription('');
        setNewMemberId('');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create ticket', 'error');
    }
  };

  // Fetch Member 360
  const handleSearchMember360 = async (memIdToSearch?: string) => {
    const q = memIdToSearch || searchMemberQuery;
    if (!q) return;
    try {
      setLoading360(true);
      const res = await crmService.getMember360(q.trim());
      if (res.success) {
        setMember360(res.profile);
      }
    } catch (err: any) {
      showToast(err.message || 'Member not found', 'error');
      setMember360(null);
    } finally {
      setLoading360(false);
    }
  };

  // Live Chat Select & Send
  const openChatSession = async (session: ChatSession) => {
    setActiveChatSession(session);
    try {
      const res = await crmService.getChatMessages(session.id);
      if (res.success) {
        setChatMessages(res.messages);
      }
    } catch (err: any) {
      showToast('Failed to load chat messages', 'error');
    }
  };

  const handleSendChatMessage = async () => {
    if (!activeChatSession || !chatInput.trim()) return;
    try {
      const res = await crmService.sendChatMessage(activeChatSession.id, chatInput.trim());
      if (res.success) {
        setChatMessages((prev) => [...prev, res.message]);
        setChatInput('');
      }
    } catch (err: any) {
      showToast('Error sending message', 'error');
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.currentStatus !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (departmentFilter !== 'ALL' && t.department !== departmentFilter) return false;
      if (showOverdueOnly && !t.isSlaResolutionBreached && !t.isSlaResponseBreached) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.memberFullName.toLowerCase().includes(q) ||
          (t.membershipNo && t.membershipNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, departmentFilter, showOverdueOnly, searchQuery]);

  // Priority Badge Color
  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200 font-semibold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Badge Color
  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WAITING_FOR_MEMBER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Format SLA Remaining Time
  const formatSlaRemaining = (dueIso: string) => {
    const diff = new Date(dueIso).getTime() - Date.now();
    if (diff <= 0) {
      const overdueMins = Math.abs(Math.floor(diff / (1000 * 60)));
      if (overdueMins < 60) return `⚠️ Breached ${overdueMins}m ago`;
      const overdueHours = Math.floor(overdueMins / 60);
      return `⚠️ Breached ${overdueHours}h ago`;
    }
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `${hours}h ${remMins}m left`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  };

  return (
    <div id="crm-support-hub" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">CRM & Help Desk Operations</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Phase 18 Verified
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Omnichannel Member Support, SLA Enforcement, Case Escalations & 360° Portfolio Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="refresh-crm-btn"
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="open-create-ticket-btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Tickers & Metrics Grid */}
      {dashboardMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Open Tickets</span>
              <LifeBuoy className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{dashboardMetrics.openTickets}</p>
            <span className="text-xs text-slate-500">Across all depts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>SLA Compliance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{dashboardMetrics.slaComplianceRate}%</p>
            <span className="text-xs text-slate-500">Target: 95.0%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>SLA Overdue</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{dashboardMetrics.overdueTickets}</p>
            <span className="text-xs text-rose-500 font-medium">Action Required</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Escalated Cases</span>
              <ArrowUpRight className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{dashboardMetrics.pendingEscalations}</p>
            <span className="text-xs text-slate-500">Level 1-3 Review</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Avg Resolution</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{dashboardMetrics.avgResolutionHours}h</p>
            <span className="text-xs text-slate-500">Resolved Today: {dashboardMetrics.resolvedToday}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Member CSAT</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{dashboardMetrics.averageCsat} / 5.0</p>
            <span className="text-xs text-slate-500">Member Ratings</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          id="crm-tab-tickets"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tickets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Tickets & Case Queue</span>
          <span
            className={`ml-1.5 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'tickets' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {tickets.length}
          </span>
        </button>

        <button
          id="crm-tab-member360"
          onClick={() => {
            setActiveTab('member360');
            if (!member360) handleSearchMember360('WB000001');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'member360'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Member 360° Intelligence</span>
        </button>

        <button
          id="crm-tab-chat"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat Concierge</span>
          {chatSessions.filter((c) => c.status === 'WAITING_AGENT' || c.status === 'AGENT_CONNECTED').length > 0 && (
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          id="crm-tab-kb"
          onClick={() => setActiveTab('kb')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'kb'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-200 text-slate-700 rounded-full">
            {kbArticles.length}
          </span>
        </button>

        <button
          id="crm-tab-sla"
          onClick={() => setActiveTab('sla')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'sla'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>SLA & Team Performance</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: TICKETS & CASE QUEUE */}
      {/* ========================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-ticket-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ticket #, Member Name, Membership # or Subject..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_MEMBER">Waiting for Member</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                id="filter-priority-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                id="filter-dept-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Depts</option>
                <option value="CUSTOMER_SERVICE">Customer Service</option>
                <option value="FINANCE">Finance</option>
                <option value="LOANS">Loans</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="IT_SUPPORT">IT Support</option>
              </select>

              <button
                id="filter-overdue-toggle"
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showOverdueOnly
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Overdue Only</span>
              </button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Ticket #</th>
                    <th className="px-4 py-3.5">Subject & Category</th>
                    <th className="px-4 py-3.5">Member Details</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">SLA Countdown</th>
                    <th className="px-4 py-3.5">Assignee</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        <LifeBuoy className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-base font-medium text-slate-700">No support tickets found</p>
                        <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new ticket.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const isBreached = t.isSlaResolutionBreached || t.isSlaResponseBreached;
                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isBreached ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-semibold text-indigo-600 whitespace-nowrap">
                            #{t.ticketNumber}
                            {t.escalationLevel > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">
                                L{t.escalationLevel}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <p className="font-medium text-slate-900 truncate">{t.subject}</p>
                            <span className="text-xs text-slate-400">{t.category.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="font-medium text-slate-800">{t.memberFullName}</p>
                            <button
                              onClick={() => {
                                setSearchMemberQuery(t.membershipNo || t.memberId || '');
                                setActiveTab('member360');
                                handleSearchMember360(t.membershipNo || t.memberId);
                              }}
                              className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
                            >
                              <span>{t.membershipNo || 'Guest'}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getPriorityBadge(
                                t.priority
                              )}`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(
                                t.currentStatus
                              )}`}
                            >
                              {t.currentStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                            {t.department.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <Clock className={`w-3.5 h-3.5 ${isBreached ? 'text-rose-500' : 'text-slate-400'}`} />
                              <span
                                className={`text-xs font-medium ${
                                  isBreached ? 'text-rose-600 font-bold' : 'text-slate-600'
                                }`}
                              >
                                {t.currentStatus === 'RESOLVED' || t.currentStatus === 'CLOSED'
                                  ? 'Resolved'
                                  : formatSlaRemaining(t.slaResolutionDue)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                            {t.assignedStaffName || <span className="text-slate-400 italic">Unassigned</span>}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              id={`view-ticket-${t.id}`}
                              onClick={() => openTicketDetails(t)}
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open Case</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: MEMBER 360° INTELLIGENCE */}
      {/* ========================================== */}
      {activeTab === 'member360' && (
        <div className="space-y-6">
          {/* Member Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-member-360-input"
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMember360()}
                placeholder="Enter Membership Number (e.g. WB000001) or Member ID..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              id="lookup-member-360-btn"
              onClick={() => handleSearchMember360()}
              disabled={loading360}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {loading360 ? 'Loading...' : 'Lookup Member 360°'}
            </button>
          </div>

          {member360 && (
            <div className="space-y-6">
              {/* Member Profile Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/50 border-2 border-indigo-300 flex items-center justify-center text-2xl font-bold text-white">
                    {member360.member.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold">{member360.member.fullName}</h2>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                        {member360.member.status}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30">
                        KYC {member360.member.kycStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200 mt-1.5">
                      <span>Membership No: <strong className="text-white">{member360.member.memberNo}</strong></span>
                      <span>•</span>
                      <span>Phone: <strong className="text-white">{member360.member.phone}</strong></span>
                      <span>•</span>
                      <span>Email: <strong className="text-white">{member360.member.email}</strong></span>
                      <span>•</span>
                      <span>Branch: <strong className="text-white">{member360.member.branch}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setNewMemberId(member360.member.id);
                      setNewSubject(`Inquiry for ${member360.member.fullName} (${member360.member.memberNo})`);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-white text-indigo-900 hover:bg-slate-100 rounded-lg shadow transition-colors"
                  >
                    + Open Support Case
                  </button>
                </div>
              </div>

              {/* Financial Snapshot Cards (Read-Only) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Savings Accounts Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Savings Portfolio</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                      {member360.savings.accountsCount} Accounts
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Total Savings Balance</span>
                    <p className="text-2xl font-black text-emerald-700">
                      ETB {member360.savings.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {member360.savings.accounts.map((acc) => (
                      <div key={acc.id} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{acc.productName}</p>
                          <span className="text-slate-400">{acc.accountNumber}</span>
                        </div>
                        <span className="font-bold text-slate-900">ETB {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shares Portfolio Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Share Capital</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {member360.shares.certificateCount} Certs
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Total Share Value</span>
                    <p className="text-2xl font-black text-blue-700">
                      ETB {member360.shares.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Total Registered Shares:</span>
                    <span className="font-bold text-slate-900">{member360.shares.totalShares} Shares</span>
                  </div>
                </div>

                {/* Loan Portfolio Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Credit & Loans</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {member360.loans.activeLoansCount} Active
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Total Loan Exposure</span>
                    <p className="text-2xl font-black text-purple-700">
                      ETB {member360.loans.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {member360.loans.loans.length === 0 ? (
                      <p className="text-xs text-slate-400">No active loans on file</p>
                    ) : (
                      member360.loans.loans.map((ln) => (
                        <div key={ln.id} className="flex justify-between items-center text-xs">
                          <div>
                            <p className="font-semibold text-slate-800">{ln.productName}</p>
                            <span className="text-slate-400">{ln.loanNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">ETB {ln.totalOutstanding.toLocaleString()}</span>
                            <span className="block text-[10px] text-emerald-600 font-semibold">{ln.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Case History & Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Support History */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                      <LifeBuoy className="w-4 h-4 text-indigo-600" />
                      <span>Past Support & Case History</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      {member360.supportHistory.openTickets} Open / {member360.supportHistory.resolvedTickets} Resolved
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {member360.supportHistory.tickets.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No previous support tickets recorded.</p>
                    ) : (
                      member360.supportHistory.tickets.map((t) => (
                        <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-indigo-600">#{t.ticketNumber}</span>
                              <span className="font-medium text-slate-800">{t.subject}</span>
                            </div>
                            <span className="text-slate-400">{new Date(t.createdDate).toLocaleDateString()}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${getStatusBadge(
                              t.currentStatus as TicketStatus
                            )}`}
                          >
                            {t.currentStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Transactions (Audit View) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>Recent Ledger Transactions (Audit View)</span>
                    </h3>
                    <span className="text-xs text-slate-400">Read-Only Financials</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {member360.recentTransactions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No recent transactions recorded.</p>
                    ) : (
                      member360.recentTransactions.map((tx) => (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-800">{tx.type.replace(/_/g, ' ')}</p>
                            <span className="text-slate-400">{tx.reference} • {new Date(tx.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">ETB {tx.amount.toLocaleString()}</span>
                            <span className="block text-[10px] text-slate-500">{tx.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: LIVE CHAT CONCIERGE */}
      {/* ========================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-indigo-600" />
                <span>Live Chat Queue</span>
              </h3>
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                {chatSessions.length} Active
              </span>
            </div>

            <div className="space-y-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => openChatSession(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeChatSession?.id === session.id
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{session.memberName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        session.status === 'AGENT_CONNECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Session #{session.sessionNo}</p>
                  <span className="text-[10px] text-slate-400">
                    Dept: {session.department}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Chat Conversation */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            {activeChatSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{activeChatSession.memberName}</span>
                      <span className="text-xs text-slate-500">({activeChatSession.memberEmail || 'Member'})</span>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">
                      Assigned to: {activeChatSession.assignedAgentName || 'You'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        await crmService.closeChatSession(activeChatSession.id);
                        showToast('Chat closed', 'info');
                        loadData();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {chatMessages.map((msg) => {
                    const isAgent = msg.sender === 'AGENT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-sm shadow-sm ${
                            isAgent
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <span className={`text-[10px] font-bold block mb-1 ${isAgent ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.senderName}
                          </span>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="Type reply to member..."
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    className="p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">Select a chat session to start assisting member</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: KNOWLEDGE BASE HUB */}
      {/* ========================================== */}
      {activeTab === 'kb' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Knowledge Base & Standard Operating Procedures</span>
            </h3>
            <button
              onClick={() => {
                setSelectedArticle(null);
                setArticleTitle('');
                setArticleCategory('Savings');
                setArticleContent('');
                setArticleTags('');
                setShowArticleModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              + Publish New Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kbArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded">
                    {art.category}
                  </span>
                  <span className="text-xs text-slate-400">{art.articleCode}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">{art.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{art.summary}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{art.viewCount}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{art.helpfulCount}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedArticle(art);
                      setArticleTitle(art.title);
                      setArticleCategory(art.category);
                      setArticleContent(art.content);
                      setArticleTags(art.tags.join(', '));
                      setShowArticleModal(true);
                    }}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    View / Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: SLA POLICIES & TEAM PERFORMANCE */}
      {/* ========================================== */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          {/* SLA Policies Matrix */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">SLA Policy Rules & Target Response Matrix</h3>
              </div>
              <span className="text-xs text-slate-500">Enforced on all ticket incoming pipelines</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Priority Level</th>
                    <th className="px-4 py-3">First Response Target</th>
                    <th className="px-4 py-3">Resolution Deadline</th>
                    <th className="px-4 py-3">Escalation Threshold</th>
                    <th className="px-4 py-3">Policy Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slaPolicies.map((pol) => (
                    <tr key={pol.id}>
                      <td className="px-4 py-3 font-semibold">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full border ${getPriorityBadge(pol.priority)}`}>
                          {pol.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{pol.firstResponseMinutes} Minutes ({pol.firstResponseMinutes / 60}h)</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{pol.resolutionMinutes} Minutes ({pol.resolutionMinutes / 60}h)</td>
                      <td className="px-4 py-3 text-slate-700">{pol.escalationThresholdPercent}% of SLA Window</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">
                          {pol.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Performance Leaderboard */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Customer Support Agent Performance & CSAT Index</h3>
              </div>
              <span className="text-xs text-slate-500">Live Calculated Metrics</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Agent Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Assigned Cases</th>
                    <th className="px-4 py-3">Resolved</th>
                    <th className="px-4 py-3">Avg Resolution</th>
                    <th className="px-4 py-3">SLA Breaches</th>
                    <th className="px-4 py-3">CSAT Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agentPerformance.map((ag) => (
                    <tr key={ag.agentId}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{ag.agentName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{ag.department}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ag.assignedCount}</td>
                      <td className="px-4 py-3 font-medium text-emerald-700">{ag.resolvedCount}</td>
                      <td className="px-4 py-3 text-slate-700">{ag.avgResolutionHours}h</td>
                      <td className="px-4 py-3 text-rose-600 font-bold">{ag.slaBreachCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1 text-amber-500 font-bold">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span>{ag.csatAverage.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TICKET DETAILS MODAL / DRAWER */}
      {/* ========================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="font-black text-indigo-700 text-lg">#{selectedTicket.ticketNumber}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(selectedTicket.currentStatus)}`}>
                  {selectedTicket.currentStatus.replace(/_/g, ' ')}
                </span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getPriorityBadge(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEscalateModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center space-x-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Escalate Case</span>
                </button>

                <button
                  onClick={() => setShowMergeModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merge</span>
                </button>

                {selectedTicket.currentStatus !== 'RESOLVED' && selectedTicket.currentStatus !== 'CLOSED' ? (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve Ticket</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReopen}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                  >
                    Reopen Case
                  </button>
                )}

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (2 Columns) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Conversation Timeline & Reply Box */}
              <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50/50">
                {/* Subject Header */}
                <div className="p-4 bg-white border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span>Category: <strong>{selectedTicket.category.replace(/_/g, ' ')}</strong></span>
                    <span>•</span>
                    <span>Department: <strong>{selectedTicket.department}</strong></span>
                    <span>•</span>
                    <span>Opened: {new Date(selectedTicket.createdDate).toLocaleString()}</span>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {loadingMessages ? (
                    <p className="text-xs text-slate-400 text-center py-8">Loading conversation history...</p>
                  ) : (
                    ticketMessages.map((msg) => {
                      if (msg.isInternalNote) {
                        return (
                          <div key={msg.id} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl shadow-xs text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-amber-800 font-bold">
                              <span className="flex items-center space-x-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>🔒 Staff Internal Note — {msg.senderName} ({msg.senderRole})</span>
                              </span>
                              <span className="text-[10px] text-amber-600 font-normal">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        );
                      }

                      if (msg.type === 'ESCALATION') {
                        return (
                          <div key={msg.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                            <span className="font-bold text-rose-800 flex items-center space-x-1">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>{msg.content}</span>
                            </span>
                          </div>
                        );
                      }

                      const isStaff = msg.type === 'STAFF_REPLY';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-xl p-4 rounded-2xl text-xs shadow-xs space-y-1.5 ${
                              isStaff
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className={`font-bold ${isStaff ? 'text-indigo-200' : 'text-indigo-900'}`}>
                                {msg.senderName} {isStaff && '(SACCO Staff)'}
                              </span>
                              <span className={`text-[10px] ${isStaff ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply / Internal Note Composer */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                  <div className="flex items-center space-x-3 text-xs">
                    <button
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        !isInternalNote
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Public Reply to Member
                    </button>
                    <button
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center space-x-1 ${
                        isInternalNote
                          ? 'bg-amber-200 text-amber-900 font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>🔒 Staff Internal Note</span>
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      id="ticket-reply-textarea"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Type internal staff note (visible ONLY to authorized staff & managers)...'
                          : 'Type response to member (notifies member via In-App / SMS / Email)...'
                      }
                      className={`w-full p-3 text-xs border rounded-xl focus:outline-none focus:ring-2 resize-none ${
                        isInternalNote
                          ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-500'
                          : 'border-slate-200 focus:ring-indigo-500'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-400">
                        {isInternalNote ? '🔒 Protected note' : 'Public response'}
                      </span>
                      <button
                        id="send-ticket-reply-btn"
                        onClick={handleSendMessage}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingReply ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Properties & Member Card */}
              <div className="w-80 bg-white p-5 overflow-y-auto space-y-6 text-xs">
                {/* SLA Ticker Widget */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>SLA Targets</span>
                  </span>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Resolution SLA:</span>
                      <strong className={selectedTicket.isSlaResolutionBreached ? 'text-rose-600' : 'text-slate-900'}>
                        {formatSlaRemaining(selectedTicket.slaResolutionDue)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>First Response:</span>
                      <strong className="text-slate-900">
                        {selectedTicket.firstRespondedAt ? 'Completed' : formatSlaRemaining(selectedTicket.slaFirstResponseDue)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Case Properties */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                    Case Properties
                  </span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Status</label>
                      <select
                        value={selectedTicket.currentStatus}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="WAITING_FOR_MEMBER">WAITING FOR MEMBER</option>
                        <option value="ESCALATED">ESCALATED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Department</label>
                      <select
                        value={selectedTicket.department}
                        onChange={(e) =>
                          crmService
                            .updateTicket(selectedTicket.id, { department: e.target.value as TicketDepartment })
                            .then(loadData)
                        }
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="CUSTOMER_SERVICE">Customer Service</option>
                        <option value="FINANCE">Finance</option>
                        <option value="LOANS">Loans</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="IT_SUPPORT">IT Support</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Member Info */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                    Member Contact
                  </span>
                  <div className="space-y-1.5 text-slate-700">
                    <p className="font-bold text-slate-900 text-sm">{selectedTicket.memberFullName}</p>
                    <p>Membership #: {selectedTicket.membershipNo || 'N/A'}</p>
                    <p>Email: {selectedTicket.memberEmail || 'N/A'}</p>
                    <p>Phone: {selectedTicket.memberPhone || 'N/A'}</p>
                    <button
                      onClick={() => {
                        setSearchMemberQuery(selectedTicket.membershipNo || selectedTicket.memberId || '');
                        setActiveTab('member360');
                        handleSearchMember360(selectedTicket.membershipNo || selectedTicket.memberId);
                        setSelectedTicket(null);
                      }}
                      className="mt-2 w-full py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Full 360° Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ESCALATE CASE */}
      {/* ========================================== */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-base border-b border-slate-100 pb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span>Escalate Case to Higher Authority</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Escalation Tier</label>
                <select
                  value={escalateLevel}
                  onChange={(e) => setEscalateLevel(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                >
                  <option value={1}>Level 1: Customer Service Supervisor</option>
                  <option value={2}>Level 2: General SACCO Manager</option>
                  <option value={3}>Level 3: Executive Board of Directors</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Escalation</label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain why this case requires senior executive intervention or board exception..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: RESOLVE TICKET */}
      {/* ========================================== */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-base border-b border-slate-100 pb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Mark Ticket as Resolved</span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Provide resolution notes explaining the solution provided to the member. A CSAT survey prompt will automatically be sent.
              </p>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="e.g. Deposit verified and credited to regular savings account #SAV-REG-000143..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Complete & Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: MERGE TICKETS */}
      {/* ========================================== */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-2">
              <GitMerge className="w-5 h-5 text-indigo-600" />
              <span>Merge Duplicate Ticket</span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Merge a secondary duplicate ticket into #{selectedTicket?.ticketNumber}. The secondary ticket will be closed and its messages linked.
              </p>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Secondary Ticket ID</label>
                <select
                  value={secondaryMergeId}
                  onChange={(e) => setSecondaryMergeId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select ticket to merge...</option>
                  {tickets
                    .filter((t) => t.id !== selectedTicket?.id && t.currentStatus !== 'CLOSED')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.ticketNumber} - {t.subject} ({t.memberFullName})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeSubmit}
                disabled={!secondaryMergeId}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Merge Tickets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CREATE NEW SUPPORT TICKET */}
      {/* ========================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <LifeBuoy className="w-5 h-5 text-indigo-600" />
                <span>Open New Support Ticket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Member ID or Membership # (Optional)</label>
                <input
                  type="text"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="e.g. WB000001 or leave empty for general inquiry"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                    <option value="SAVINGS_ACCOUNT">Savings Account</option>
                    <option value="SHARE_PURCHASE">Share Purchase</option>
                    <option value="LOAN_APPLICATION">Loan Application</option>
                    <option value="DISPUTE_CLAIM">Dispute & Claim</option>
                    <option value="KYC_VERIFICATION">KYC Verification</option>
                    <option value="TECHNICAL_ISSUE">Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as TicketDepartment)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="CUSTOMER_SERVICE">Customer Service</option>
                    <option value="FINANCE">Finance</option>
                    <option value="LOANS">Loans</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="IT_SUPPORT">IT Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Summary of the issue or inquiry"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide complete details, transaction references, or member context..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Register Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: KB ARTICLE EDITOR */}
      {/* ========================================== */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedArticle ? 'Edit KB Article' : 'Publish Knowledge Base Article'}
              </h3>
              <button onClick={() => setShowArticleModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Article title"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={articleCategory}
                    onChange={(e) => setArticleCategory(e.target.value)}
                    placeholder="e.g. Savings, Loans, Shares, KYC"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={articleTags}
                    onChange={(e) => setArticleTags(e.target.value)}
                    placeholder="e.g. deposit, cbe, withdraw"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Article Content (Markdown Supported)</label>
                <textarea
                  rows={8}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="Write comprehensive guidance for members and staff..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowArticleModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (selectedArticle) {
                      await crmService.updateKbArticle(selectedArticle.id, {
                        title: articleTitle,
                        category: articleCategory,
                        content: articleContent,
                        tags: articleTags.split(',').map((t) => t.trim()),
                      });
                      showToast('Article updated', 'success');
                    } else {
                      await crmService.createKbArticle({
                        title: articleTitle,
                        category: articleCategory,
                        content: articleContent,
                        tags: articleTags.split(',').map((t) => t.trim()),
                      });
                      showToast('Article published', 'success');
                    }
                    setShowArticleModal(false);
                    loadData();
                  } catch (err: any) {
                    showToast(err.message || 'Error saving article', 'error');
                  }
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
