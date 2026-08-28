import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  BookOpen,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  Star,
  ThumbsUp,
  ThumbsDown,
  Tag,
  ShieldCheck,
  Headphones,
  User,
  ArrowUpRight,
  RefreshCw,
  FileText,
  XCircle,
  Sliders,
  HelpCircle,
  Building,
  Check,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { crmService } from '../../services/crmService';
import {
  SupportTicket,
  TicketMessage,
  KnowledgeBaseArticle,
  ChatSession,
  ChatMessage,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketStatus,
} from '../../types/crm';

export const MemberSupportPortal: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    toast[type](
      type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Attention' : 'Notice',
      message
    );
  };

  const [activeTab, setActiveTab] = useState<'tickets' | 'new-ticket' | 'kb' | 'chat'>('tickets');
  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [kbSearch, setKbSearch] = useState<string>('');
  const [kbCategory, setKbCategory] = useState<string>('ALL');

  // Selected Ticket State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // CSAT Rating Modal State
  const [showCsatModal, setShowCsatModal] = useState<boolean>(false);
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatFeedback, setCsatFeedback] = useState<string>('');
  const [submittingCsat, setSubmittingCsat] = useState<boolean>(false);

  // New Ticket Form State
  const [newCategory, setNewCategory] = useState<TicketCategory>('GENERAL_INQUIRY');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDepartment, setNewDepartment] = useState<TicketDepartment>('CUSTOMER_SERVICE');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  // Live Chat State
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);

  // Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, kbRes, chatRes] = await Promise.all([
        crmService.getTickets(),
        crmService.getKbArticles(),
        crmService.getChatSessions(),
      ]);

      if (ticketsRes.success) setTickets(Array.isArray(ticketsRes.tickets) ? ticketsRes.tickets : []);
      if (kbRes.success) setKbArticles(Array.isArray(kbRes.articles) ? kbRes.articles : []);
      if (chatRes.success) {
        const sess = Array.isArray(chatRes.sessions) ? chatRes.sessions : [];
        setChatSessions(sess);
        if (sess.length > 0 && !activeChatSession) {
          const active = sess.find((s) => s.status !== 'CLOSED') || sess[0];
          setActiveChatSession(active);
          loadChatMessages(active.id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load support data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load Ticket Messages
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      setLoadingMessages(true);
      const res = await crmService.getTicketById(ticket.id);
      if (res.success) {
        setTicketMessages(res.messages.filter((m) => !m.isInternalNote)); // Hide internal staff notes from member view
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load conversation history', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Reply to Ticket
  const handleSendTicketReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await crmService.addMessage(selectedTicket.id, {
        content: replyText.trim(),
        isInternalNote: false,
      });
      if (res.success) {
        setTicketMessages((prev) => [...prev, res.data]);
        setReplyText('');
        showToast('Reply submitted to support team', 'success');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Submit CSAT
  const handleCsatSubmit = async () => {
    if (!selectedTicket) return;
    try {
      setSubmittingCsat(true);
      const res = await crmService.submitCsat(selectedTicket.id, {
        rating: csatRating,
        comment: csatFeedback.trim(),
      });
      if (res.success) {
        showToast('Thank you for your valuable feedback!', 'success');
        setSelectedTicket((prev) => (prev ? { ...prev, satisfactionRating: csatRating, satisfactionFeedback: csatFeedback } : null));
        setShowCsatModal(false);
        setCsatFeedback('');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting feedback', 'error');
    } finally {
      setSubmittingCsat(false);
    }
  };

  // Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      showToast('Subject and description are required', 'warning');
      return;
    }
    try {
      setCreatingTicket(true);
      const res = await crmService.createTicket({
        category: newCategory,
        priority: newPriority,
        department: newDepartment,
        subject: newSubject.trim(),
        description: newDescription.trim(),
      });
      if (res.success) {
        showToast(`Ticket #${res.ticket.ticketNumber} registered successfully!`, 'success');
        setNewSubject('');
        setNewDescription('');
        setActiveTab('tickets');
        loadData();
        handleSelectTicket(res.ticket);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to register ticket', 'error');
    } finally {
      setCreatingTicket(false);
    }
  };

  // Load Chat Messages
  const loadChatMessages = async (sessionId: string) => {
    try {
      const res = await crmService.getChatMessages(sessionId);
      if (res.success) {
        setChatMessages(res.messages);
      }
    } catch {
      // silent catch for polling
    }
  };

  // Send Chat Message
  const handleSendChatMessage = async () => {
    if (!activeChatSession || !chatInput.trim()) return;
    try {
      setSendingChat(true);
      const res = await crmService.sendChatMessage(activeChatSession.id, chatInput.trim());
      if (res.success) {
        setChatInput('');
        loadChatMessages(activeChatSession.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSendingChat(false);
    }
  };

  // Start New Chat Session
  const handleStartNewChat = async () => {
    try {
      const res = await crmService.createChatSession({ initialMessage: 'Hello, I would like some assistance with my account.' });
      if (res.success) {
        showToast('Connected to Member Care Agent', 'success');
        setActiveChatSession(res.session);
        loadChatMessages(res.session.id);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error starting chat session', 'error');
    }
  };

  // Close Chat
  const handleCloseChat = async () => {
    if (!activeChatSession) return;
    try {
      await crmService.closeChatSession(activeChatSession.id);
      showToast('Chat session completed', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error closing chat', 'error');
    }
  };

  // Vote KB
  const handleVoteKb = async (articleId: string, isHelpful: boolean) => {
    try {
      const res = await crmService.voteKbArticle(articleId, isHelpful);
      if (res.success) {
        showToast('Thank you for your feedback!', 'success');
        setKbArticles((prev) =>
          prev.map((a) =>
            a.id === articleId
              ? {
                  ...a,
                  helpfulCount: isHelpful ? a.helpfulCount + 1 : a.helpfulCount,
                  notHelpfulCount: !isHelpful ? a.notHelpfulCount + 1 : a.notHelpfulCount,
                }
              : a
          )
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Feedback error', 'error');
    }
  };

  // Filtered Tickets
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const filteredTickets = safeTickets.filter((t) => {
    const matchesSearch =
      (t.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered KB Articles
  const safeKbArticles = Array.isArray(kbArticles) ? kbArticles : [];
  const filteredKbArticles = safeKbArticles.filter((art) => {
    const matchesSearch =
      (art.title || '').toLowerCase().includes(kbSearch.toLowerCase()) ||
      (art.summary || '').toLowerCase().includes(kbSearch.toLowerCase()) ||
      (Array.isArray(art.tags) ? art.tags : []).some((tag) => tag.toLowerCase().includes(kbSearch.toLowerCase()));
    const matchesCat = kbCategory === 'ALL' || (art.category || '').toLowerCase() === kbCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Badges
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WAITING_FOR_MEMBER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Wabi SACCO Member Support & Inquiries Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            How can we assist you today?
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Submit service requests, lodge complaints or dispute inquiries, chat live with support officers, or consult cooperative standard operating procedures.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('new-ticket')}
              className="px-4 py-2 text-xs font-bold text-indigo-950 bg-white hover:bg-indigo-50 rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Open New Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 rounded-xl transition-all flex items-center space-x-2"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Live Support Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('kb')}
              className="px-4 py-2 text-xs font-semibold text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Knowledge Base</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs space-x-2">
        <button
          onClick={() => {
            setActiveTab('tickets');
            setSelectedTicket(null);
          }}
          className={`py-3.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'tickets'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>My Support Tickets & Requests ({(tickets || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new-ticket')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'new-ticket'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Request</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Member Care Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('kb')}
          className={`py-3.5 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'kb'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Help Articles & Policies ({(kbArticles || []).length})</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: MY TICKETS */}
      {/* ========================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {!selectedTicket ? (
            <>
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticket #, subject, or category..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_FOR_MEMBER">WAITING FOR ACTION</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>

                  <button
                    onClick={loadData}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tickets List */}
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                  Loading your support requests...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-base">No Support Tickets Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have no active inquiries or issues recorded. If you require assistance, click the button below.
                  </p>
                  <button
                    onClick={() => setActiveTab('new-ticket')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                  >
                    + Open New Request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-black text-indigo-700 text-sm">#{t.ticketNumber}</span>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(t.currentStatus)}`}>
                            {t.currentStatus.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${getPriorityBadge(t.priority)}`}>
                            {t.priority} Priority
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(t.createdDate).toLocaleDateString()}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t.subject}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{t.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.category.replace(/_/g, ' ')}</span>
                          </span>
                          {t.assignedStaffName && (
                            <span className="flex items-center space-x-1 text-slate-700">
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Assigned: <strong>{t.assignedStaffName}</strong></span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-indigo-600 font-semibold">
                          <span>View Conversation</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* TICKET DETAIL VIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              {/* Detail Header */}
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs text-indigo-600 hover:underline font-semibold flex items-center space-x-1 mb-1.5"
                  >
                    <span>← Back to all tickets</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-black text-slate-900 text-lg">#{selectedTicket.ticketNumber} — {selectedTicket.subject}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(selectedTicket.currentStatus)}`}>
                      {selectedTicket.currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* CSAT Button */}
                {(selectedTicket.currentStatus === 'RESOLVED' || selectedTicket.currentStatus === 'CLOSED') && (
                  <button
                    onClick={() => setShowCsatModal(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>
                      {selectedTicket.satisfactionRating
                        ? `Rated: ${selectedTicket.satisfactionRating} / 5 Stars`
                        : 'Rate Service Quality (CSAT)'}
                    </span>
                  </button>
                )}
              </div>

              {/* Resolution Banner if resolved */}
              {selectedTicket.resolutionSummary && (
                <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolution Summary from Support Officer</span>
                  </div>
                  <p className="leading-relaxed pl-5">{selectedTicket.resolutionSummary}</p>
                </div>
              )}

              {/* Thread Messages */}
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-slate-50/50">
                {/* Initial Description */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-slate-900">Ticket Initial Request</span>
                    <span>{new Date(selectedTicket.createdDate).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>

                {loadingMessages ? (
                  <p className="text-xs text-slate-400 text-center py-4">Loading messages...</p>
                ) : (
                  ticketMessages.map((msg) => {
                    const isMember = msg.senderRole === 'MEMBER' || msg.type === 'MEMBER_MESSAGE';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMember ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-xl p-4 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                            isMember
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className={`font-bold ${isMember ? 'text-indigo-200' : 'text-indigo-900'}`}>
                              {msg.senderName} {!isMember && '(SACCO Support)'}
                            </span>
                            <span className={`text-[10px] ${isMember ? 'text-indigo-200' : 'text-slate-400'}`}>
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

              {/* Reply Box */}
              {selectedTicket.currentStatus !== 'CLOSED' ? (
                <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Submit Reply to Support Officer</label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response or additional details..."
                      className="flex-1 p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <button
                      onClick={handleSendTicketReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sendingReply ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 text-center text-xs text-slate-500 font-medium">
                  This case is CLOSED. If you have an additional inquiry, please open a new support ticket.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: CREATE NEW TICKET */}
      {/* ========================================== */}
      {activeTab === 'new-ticket' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Submit Service Request / Issue Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide complete details so our customer care team and departmental officers can resolve your case within SLA deadlines.
            </p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="GENERAL_INQUIRY">General Inquiry</option>
                  <option value="SAVINGS_ACCOUNT">Savings Account / Deposits</option>
                  <option value="SHARE_PURCHASE">Share Purchases & Dividends</option>
                  <option value="LOAN_APPLICATION">Loan Underwriting & Repayment</option>
                  <option value="DISPUTE_CLAIM">Dispute & Claim</option>
                  <option value="KYC_VERIFICATION">KYC Verification / Profile</option>
                  <option value="TECHNICAL_ISSUE">Technical Issue / App Problem</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Urgency / Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="LOW">Low (General question)</option>
                  <option value="MEDIUM">Medium (Standard request - 8h response)</option>
                  <option value="HIGH">High (Important issue - 2h response)</option>
                  <option value="CRITICAL">Critical (Urgent financial dispute - 30m response)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                required
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of your inquiry or problem"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Detailed Description</label>
              <textarea
                required
                rows={5}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your issue with transaction IDs, bank slip references, or specific questions..."
                className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('tickets')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingTicket}
                className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all"
              >
                {creatingTicket ? 'Submitting...' : 'Register Support Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: LIVE CHAT */}
      {/* ========================================== */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Wabi SACCO Instant Member Care</h4>
                <p className="text-[11px] text-indigo-200 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>
                    {activeChatSession?.assignedAgentName || 'Connected to Virtual Assistant & Available Officers'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeChatSession ? (
                <button
                  onClick={handleCloseChat}
                  className="px-3 py-1 text-xs font-semibold bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
                >
                  End Chat
                </button>
              ) : (
                <button
                  onClick={handleStartNewChat}
                  className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Start New Session
                </button>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/70">
            {(chatMessages || []).length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">Send a message to speak with a member care representative</p>
              </div>
            ) : (
              chatMessages.map((c) => {
                const isMember = c.sender === 'MEMBER';
                return (
                  <div key={c.id} className={`flex flex-col ${isMember ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                        isMember
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : c.sender === 'BOT'
                          ? 'bg-slate-200 text-slate-900 rounded-bl-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                        <span>{c.senderName}</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder={activeChatSession ? 'Type message here...' : 'Start a session to chat...'}
              disabled={!activeChatSession}
              className="flex-1 p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSendChatMessage}
              disabled={!activeChatSession || sendingChat || !chatInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: KNOWLEDGE BASE & FAQS */}
      {/* ========================================== */}
      {activeTab === 'kb' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Search cooperative by-laws, savings rules, loan formulas, dividends..."
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={kbCategory}
                onChange={(e) => setKbCategory(e.target.value)}
                className="p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Savings">Savings & Deposits</option>
                <option value="Loans">Loans & Credit</option>
                <option value="Shares">Shares & Equity</option>
              </select>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKbArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">
                      {art.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{art.articleCode}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base leading-snug">{art.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{art.summary}</p>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {art.content}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Was this article helpful?</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleVoteKb(art.id, true)}
                      className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 bg-emerald-50 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{art.helpfulCount}</span>
                    </button>
                    <button
                      onClick={() => handleVoteKb(art.id, false)}
                      className="flex items-center space-x-1 text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 bg-rose-50 rounded-lg transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{art.notHelpfulCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CSAT RATING */}
      {/* ========================================== */}
      {showCsatModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>Rate Resolution Quality</span>
              </h3>
              <button onClick={() => setShowCsatModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-3">
              <p className="text-xs text-slate-600">
                How satisfied are you with the resolution provided for ticket #{selectedTicket.ticketNumber}?
              </p>

              {/* Star Picker */}
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCsatRating(star)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= csatRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600 block">
                {csatRating === 5
                  ? '⭐⭐⭐⭐⭐ Excellent (5/5)'
                  : csatRating === 4
                  ? '⭐⭐⭐⭐ Good (4/5)'
                  : csatRating === 3
                  ? '⭐⭐⭐ Average (3/5)'
                  : csatRating === 2
                  ? '⭐⭐ Poor (2/5)'
                  : '⭐ Very Dissatisfied (1/5)'}
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Feedback / Suggestions (Optional)</label>
              <textarea
                rows={3}
                value={csatFeedback}
                onChange={(e) => setCsatFeedback(e.target.value)}
                placeholder="Let us know what we did well or how we can improve..."
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCsatModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCsatSubmit}
                disabled={submittingCsat}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                {submittingCsat ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
