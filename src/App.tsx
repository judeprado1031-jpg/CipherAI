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
import { AuthModal } from './components/AuthModal';
import { QuizModal } from './components/QuizModal';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Handler: Log In with Google (Gmail)
  const handleLoginWithGoogle = (email = 'judeprado1031@gmail.com', name = 'Jude Prado') => {
    const updatedProfile: UserProfile = {
      ...profile,
      id: 'google_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      name,
      isGuest: false,
      authProvider: 'google',
      lastSyncedAt: Date.now(),
    };
    setProfile(updatedProfile);

    // Load user's persistent chat history for this specific account
    const saved = loadSessions(false, updatedProfile.id);
    setSessions(saved);
    if (saved.length > 0) {
      setActiveSessionId(saved[0].id);
    }
    setReviewItems(loadReviewItems(false));
    setIsAuthModalOpen(false);

    // Save and sync with cloud for this account
    saveSessions(saved, false, updatedProfile.id);
    syncWithCloud(updatedProfile.id, {
      sessions: saved,
      reviewItems: loadReviewItems(false),
      profile: updatedProfile,
    });
  };

  // Handler: Log In with Email
  const handleLoginWithEmail = (email: string, name: string) => {
    const updatedProfile: UserProfile = {
      ...profile,
      id: 'email_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      name,
      isGuest: false,
      authProvider: 'email',
      lastSyncedAt: Date.now(),
    };
    setProfile(updatedProfile);

    // Load user's persistent chat history for this specific account
    const saved = loadSessions(false, updatedProfile.id);
    setSessions(saved);
    if (saved.length > 0) {
      setActiveSessionId(saved[0].id);
    }
    setReviewItems(loadReviewItems(false));
    setIsAuthModalOpen(false);

    // Save and sync with cloud for this account
    saveSessions(saved, false, updatedProfile.id);
    syncWithCloud(updatedProfile.id, {
      sessions: saved,
      reviewItems: loadReviewItems(false),
      profile: updatedProfile,
    });
  };

  // Handler: Continue as Guest
  const handleContinueAsGuest = () => {
    const guestState: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: '',
      name: 'Guest User',
      role: 'Guest / Trial',
      currency: profile.currency || '$',
      isPro: false,
      isGuest: true,
      theme,
      authProvider: 'guest',
      lastSyncedAt: undefined,
    };
    setProfile(guestState);

    // CRITICAL: Do NOT load or keep previous conversations!
    const blankSession = createNewGuestSession();
    setSessions([blankSession]);
    setActiveSessionId(blankSession.id);
    setIsAuthModalOpen(false);
  };

  // Handler: Create new session
  const handleNewSession = () => {
    const newId = (profile.isGuest ? 'guest_msg_' : 'session-') + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: profile.isGuest ? 'Guest Calculation' : 'New Math Calculation',
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
      (image ? 'Please analyze this homework math problem in the photo step-by-step and solve it.' : '');

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
          ? 'Homework Photo Problem'
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        content: data.text,
        teachingMode: data.teachingMode || teachingMode,
        assistantMode: data.assistantMode || assistantMode,
        timestamp: data.timestamp || Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...updatedMessages, assistantMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );

      // Update remaining usage
      if (data.usage) {
        setUsage(data.usage);
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
          isGuest={!!profile.isGuest}
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
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenQuiz={() => setIsQuizOpen(true)}
          usage={usage}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main App Container */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Navigation Bar with Logo, Theme Selector, and Account/Guest actions */}
          <Navbar
            assistantMode={assistantMode}
            onAssistantModeChange={setAssistantMode}
            usage={usage}
            profile={profile}
            currentTheme={theme}
            onThemeChange={handleThemeChange}
            isSyncing={isSyncing}
            onOpenAccount={() => setIsAccountOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenReviewCenter={() => setIsReviewCenterOpen(!isReviewCenterOpen)}
            isReviewCenterOpen={isReviewCenterOpen}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onOpenQuiz={() => setIsQuizOpen(true)}
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
                isGuest={!!profile.isGuest}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onBookmarkMessage={handleBookmarkMessage}
                onOpenReviewCenterWithCalc={() => setIsReviewCenterOpen(true)}
                onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
                currency={profile.currency}
                onOpenQuiz={() => setIsQuizOpen(true)}
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

        {/* Auth Modal: Sign In / Sign Up with Gmail OR Continue as Guest */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginWithGoogle={handleLoginWithGoogle}
          onLoginWithEmail={handleLoginWithEmail}
          onContinueAsGuest={handleContinueAsGuest}
          currentProfile={profile}
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
          onOpenAuthModal={() => {
            setIsAccountOpen(false);
            setIsAuthModalOpen(true);
          }}
          onSwitchToGuest={handleContinueAsGuest}
        />

        {/* 24-Hour Limits & Subscription Modal */}
        <SubscriptionModal
          isOpen={isSubscriptionOpen}
          onClose={() => setIsSubscriptionOpen(false)}
          usage={usage}
          onTogglePro={handleTogglePro}
        />
      </div>
    </ThemeContext.Provider>
  );
}
