import React, { useState, useEffect, useCallback } from 'react';
import {
  ChatSession,
  Message,
  TeachingMode,
  AssistantMode,
  ReviewItem,
  UserProfile,
  UserUsage,
  ColorTheme,
} from './types';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  loadReviewItems,
  saveReviewItems,
  loadProfile,
  saveProfile,
  loadUsage,
  saveUsage,
  syncWithCloud,
  fetchServerUsage,
  createNewGuestSession,
} from './utils/storage';
import {
  applyThemeToDocument,
  getThemeConfig,
  ThemeContext,
  loadCustomThemeData,
  saveCustomThemeData,
} from './utils/themeConfig';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ReviewCenter } from './components/ReviewCenter';
import { AccountModal } from './components/AccountModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { QuizModal } from './components/QuizModal';
import { GraphModal } from './components/GraphModal';
import { generateGraphData } from './utils/graphGenerator';

export default function App() {
  // Profile & Theme
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [theme, setTheme] = useState<ColorTheme>(profile.theme || 'navy');
  const [customData, setCustomData] = useState(loadCustomThemeData);
  const themeConfig = getThemeConfig(theme);

  // Sessions state: If user is guest, only start with a single blank guest session!
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    loadSessions(profile.isGuest, profile.id)
  );
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    loadActiveSessionId(profile.isGuest)
  );

  const [teachingMode, setTeachingMode] = useState<TeachingMode>('teach');
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('fabm');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(() =>
    loadReviewItems(profile.isGuest)
  );
  const [usage, setUsage] = useState<UserUsage>(loadUsage);

  // UI modals
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isReviewCenterOpen, setIsReviewCenterOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme, customData]);

  const handleThemeChange = (newTheme: ColorTheme) => {
    setTheme(newTheme);
    setProfile((prev) => ({ ...prev, theme: newTheme }));
    applyThemeToDocument(newTheme);
  };

  const handleUpdateCustomTheme = (data: typeof customData) => {
    setCustomData(data);
    saveCustomThemeData(data);
    setTheme('custom');
    setProfile((prev) => ({ ...prev, theme: 'custom' }));
    applyThemeToDocument('custom');
  };

  // Sync to local storage on state change - ONLY IF NOT GUEST
  useEffect(() => {
    if (!profile.isGuest) {
      saveSessions(sessions, false, profile.id);
      syncWithCloud(profile.id, {
        sessions,
        reviewItems,
        profile,
      }).catch((err) => console.warn('Background sync error:', err));
    }
  }, [sessions, reviewItems, profile.isGuest, profile.id]);

  useEffect(() => {
    if (!profile.isGuest) {
      saveActiveSessionId(activeSessionId, false);
    }
  }, [activeSessionId, profile.isGuest]);

  useEffect(() => {
    if (!profile.isGuest) {
      saveReviewItems(reviewItems, false);
    }
  }, [reviewItems, profile.isGuest]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveUsage(usage);
  }, [usage]);

  // Initial load: Fetch real usage and cloud sync from server
  useEffect(() => {
    async function initServerState() {
      if (!profile.isGuest && profile.id) {
        const serverUsage = await fetchServerUsage(profile.id);
        if (serverUsage) {
          setUsage(serverUsage);
        }
        try {
          const res = await fetch(`/api/sync/${profile.id}`);
          if (res.ok) {
            const syncRes = await res.json();
            if (
              syncRes.success &&
              syncRes.data?.sessions &&
              Array.isArray(syncRes.data.sessions) &&
              syncRes.data.sessions.length > 0
            ) {
              setSessions(syncRes.data.sessions);
              saveSessions(syncRes.data.sessions, false, profile.id);
            }
          }
        } catch (e) {
          console.warn('Could not fetch cloud synced data:', e);
        }
      }
    }
    initServerState();
  }, [profile.id, profile.isGuest]);

  // Active session helper
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ||
    sessions[0] ||
    createNewGuestSession();

  // Sync assistant mode with active session if changed
  useEffect(() => {
    if (activeSession) {
      setAssistantMode(activeSession.assistantMode || 'cfo');
      setTeachingMode(activeSession.defaultTeachingMode || 'teach');
    }
  }, [activeSessionId]);

  // Live timer for 24h cycle reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setUsage((prev) => {
        if (prev.resetInMs > 0) {
          const updatedMs = Math.max(0, prev.resetInMs - 1000);
          return {
            ...prev,
            resetInMs: updatedMs,
            remainingUses: updatedMs === 0 && !prev.isPro ? 15 : prev.remainingUses,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handler: Create new session
  const handleNewSession = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Math Problem',
      messages: [],
      assistantMode,
      defaultTeachingMode: teachingMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setIsReviewCenterOpen(false);
  };

  // Handler: Delete session
  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fallback = createNewGuestSession();
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Handler: Pin session
  const handlePinSession = (id: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Handler: Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Handler: Send message (with optional homework photo) to Cipher API
  const handleSendMessage = async (text: string, image?: string, mimeType?: string) => {
    if ((!text.trim() && !image) || isLoading) return;

    // Check usage limits
    if (!usage.isPro && usage.remainingUses <= 0) {
      setIsSubscriptionOpen(true);
      return;
    }

    const messagePrompt =
      text.trim() ||
      (image
        ? 'Please analyze this activity, worksheet, or problem in the image. Read each question, including any multiple-choice choices (A, B, C, D), and provide the accurate answers and solutions for each question shown.'
        : '');

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: messagePrompt,
      imageUrl: image,
      imageMimeType: mimeType,
      timestamp: Date.now(),
      teachingMode,
      assistantMode,
    };

    // Update active session with user message
    const updatedMessages = [...activeSession.messages, userMessage];
    const updatedTitle =
      activeSession.messages.length === 0
        ? image
          ? 'Activity / Worksheet Problem'
          : text.slice(0, 32) + (text.length > 32 ? '...' : '')
        : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: updatedTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    const assistantMsgId = 'msg-ai-' + Date.now();
    let accumulatedContent = '';

    // Create an empty assistant placeholder immediately
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      teachingMode,
      assistantMode,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: [...updatedMessages, initialAssistantMsg],
              updatedAt: Date.now(),
            }
          : s
      )
    );

    const updateAssistantMsg = (content: string, imageUrl?: string, doneTeachingMode?: 'teach' | 'direct', doneAssistantMode?: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content,
                        ...(imageUrl ? { imageUrl } : {}),
                        ...(doneTeachingMode ? { teachingMode: doneTeachingMode } : {}),
                        ...(doneAssistantMode ? { assistantMode: doneAssistantMode as any } : {}),
                      }
                    : m
                ),
                updatedAt: Date.now(),
              }
            : s
        )
      );
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          stream: true,
          message: messagePrompt,
          image,
          mimeType,
          teachingMode,
          assistantMode,
          history: updatedMessages.map((m) => ({
            role: m.role,
            text: m.content,
          })),
          userId: profile.id,
          currency: profile.currency,
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        setUsage(errorData.usage);
        setIsSubscriptionOpen(true);
        setIsLoading(false);
        // Remove empty assistant placeholder
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: updatedMessages,
                }
              : s
          )
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
              const payload = JSON.parse(trimmed.slice(5).trim());
              if (payload.chunk) {
                accumulatedContent += payload.chunk;
                updateAssistantMsg(accumulatedContent);
              }
              if (payload.done) {
                if (payload.usage) setUsage(payload.usage);
                if (payload.graphImageUrl) {
                  updateAssistantMsg(
                    accumulatedContent,
                    payload.graphImageUrl,
                    payload.teachingMode,
                    payload.assistantMode
                  );
                }
              }
            } catch {}
          }
        }
      } else {
        const data = await response.json();
        accumulatedContent = data.text || '';
        updateAssistantMsg(accumulatedContent, data.graphImageUrl, data.teachingMode, data.assistantMode);
        if (data.usage) {
          setUsage(data.usage);
        }
      }

      // Check client-side graph fallback if graph query and no image attached yet
      const lowerPrompt = messagePrompt.toLowerCase();
      const isGraphingQuery =
        assistantMode === 'graphs' ||
        lowerPrompt.includes('graph') ||
        lowerPrompt.includes('plot') ||
        lowerPrompt.includes('parabola') ||
        lowerPrompt.includes('curve') ||
        (image && image.startsWith('data:image/svg'));

      if (isGraphingQuery) {
        try {
          const svgGraph = (image && image.startsWith('data:image/svg'))
            ? image
            : generateGraphData(messagePrompt).svgDataUrl;
          updateAssistantMsg(accumulatedContent, svgGraph);
        } catch (e) {
          console.warn('Could not auto-generate graph image:', e);
        }
      }
    } catch (err: any) {
      console.error('Failed to get answer:', err);
      const fallbackErrorMsg: Message = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `### Calculation Notice\nCipher encountered an issue processing: ${
          err.message || 'Server timeout'
        }. Please check your connection or re-send your calculation.`,
        timestamp: Date.now(),
        teachingMode,
        assistantMode,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...updatedMessages, fallbackErrorMsg],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Bookmark message to Review Center
  const handleBookmarkMessage = (message: Message) => {
    const existing = reviewItems.find((r) => r.id === message.id);
    if (existing) {
      setReviewItems(reviewItems.filter((r) => r.id !== message.id));
      return;
    }

    const newItem: ReviewItem = {
      id: message.id,
      title: activeSession.title || 'Saved Math Solution',
      category:
        assistantMode === 'fabm'
          ? 'FABM Accounting'
          : assistantMode === 'business_math'
          ? 'Business Mathematics'
          : assistantMode === 'general_math'
          ? 'General Mathematics'
          : assistantMode === 'mathematics'
          ? 'Mathematics'
          : assistantMode === 'graphs'
          ? 'Graphs & Plotting'
          : assistantMode === 'cfo'
          ? 'Corporate Finance'
          : assistantMode === 'quant'
          ? 'Quantitative'
          : 'General Math',
      problem: activeSession.messages[0]?.content || 'Financial calculation',
      solution: message.content,
      formula: '',
      tags: [assistantMode, message.teachingMode || 'teach'],
      savedAt: Date.now(),
    };

    setReviewItems([newItem, ...reviewItems]);
  };

  // Handler: Cloud Sync
  const handleTriggerSync = async () => {
    if (profile.isGuest) return;
    setIsSyncing(true);
    try {
      const res = await syncWithCloud(profile.id, {
        sessions,
        reviewItems,
        profile,
      });
      if (res.success) {
        setProfile((prev) => ({ ...prev, lastSyncedAt: res.lastSyncedAt }));
      }
    } catch (e) {
      console.error('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Toggle Pro
  const handleTogglePro = async (isPro: boolean) => {
    setProfile((prev) => ({ ...prev, isPro }));
    setUsage((prev) => ({
      ...prev,
      isPro,
      remainingUses: isPro ? 9999 : Math.min(15, prev.remainingUses),
    }));

    try {
      await fetch('/api/user/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, isPro }),
      });
    } catch (e) {
      console.error('Pro subscription toggle failed:', e);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme: handleThemeChange,
        customData,
        updateCustomTheme: handleUpdateCustomTheme,
      }}
    >
      <div
        className={`flex h-screen ${themeConfig.classes.bgApp} ${themeConfig.classes.textMain} font-sans overflow-hidden transition-colors duration-200`}
      >
        {/* Sidebar with Brand Logo, Sessions, & Guest alert */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSession.id}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            setIsReviewCenterOpen(false);
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onPinSession={handlePinSession}
          onRenameSession={handleRenameSession}
          onOpenReviewCenter={() => setIsReviewCenterOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          usage={usage}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main App Container */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Navigation Bar with Logo, Theme Selector, and Account actions */}
          <Navbar
            assistantMode={assistantMode}
            onAssistantModeChange={setAssistantMode}
            usage={usage}
            profile={profile}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
            isSyncing={isSyncing}
            onOpenAccount={() => setIsAccountOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenReviewCenter={() => setIsReviewCenterOpen(!isReviewCenterOpen)}
            isReviewCenterOpen={isReviewCenterOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onOpenGraphModal={() => setIsGraphModalOpen(true)}
          />

          {/* Content View: Review Center OR Active Chat */}
          <main className="flex-1 overflow-y-auto">
            {isReviewCenterOpen ? (
              <div className="p-4 sm:p-6 lg:p-8">
                <ReviewCenter
                  items={reviewItems}
                  onRemoveItem={(id) =>
                    setReviewItems(reviewItems.filter((item) => item.id !== id))
                  }
                  onUpdateItemNotes={(id, notes) =>
                    setReviewItems(
                      reviewItems.map((item) =>
                        item.id === id ? { ...item, notes } : item
                      )
                    )
                  }
                  currency={profile.currency}
                  onOpenChatWithProblem={(prompt) => {
                    setIsReviewCenterOpen(false);
                    handleNewSession();
                    setTimeout(() => handleSendMessage(prompt), 100);
                  }}
                />
              </div>
            ) : (
              <ChatView
                session={activeSession}
                teachingMode={teachingMode}
                onTeachingModeChange={setTeachingMode}
                assistantMode={assistantMode}
                onAssistantModeChange={setAssistantMode}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                usage={usage}
                profile={profile}
                onBookmarkMessage={handleBookmarkMessage}
                onOpenReviewCenterWithCalc={() => setIsReviewCenterOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
                currency={profile.currency}
                onOpenQuiz={() => setIsQuizOpen(true)}
                onOpenGraphModal={() => setIsGraphModalOpen(true)}
              />
            )}
          </main>
        </div>

        {/* Interactive Quiz Modal (Topic input & PDF support) */}
        <QuizModal
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          assistantMode={assistantMode}
          onSaveToReviewCenter={(item) =>
            setReviewItems((prev) => [item, ...prev])
          }
        />

        {/* Account Settings & Theme Modal */}
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          profile={profile}
          usage={usage}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          onUpdateProfile={setProfile}
          onTriggerSync={handleTriggerSync}
          isSyncing={isSyncing}
          onTogglePro={handleTogglePro}
        />

        {/* 24-Hour Limits & Subscription Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          usage={usage}
          onTogglePro={handleTogglePro}
        />

        {/* Global Graph Option Modal */}
        <GraphModal
          isOpen={isGraphModalOpen}
          onClose={() => setIsGraphModalOpen(false)}
          onSendToChat={(prompt, graphImageUrl) => {
            setIsReviewCenterOpen(false);
            handleSendMessage(prompt, graphImageUrl, 'image/svg+xml');
          }}
        />
      </div>
    </ThemeContext.Provider>
  );
}
