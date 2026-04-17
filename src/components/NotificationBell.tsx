import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';

const DROPDOWN_WIDTH = 320;
const VIEWPORT_MARGIN = 12;
const BELL_OFFSET_Y = 8; // gap between bell bottom and dropdown top

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: DROPDOWN_WIDTH });
  
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const notifications = useQuery(api.notifications.getNotifications, {
    paginationOpts: { numItems: 10, cursor: null }
  });
  
  const markRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Compute dropdown position anchored to bell button
  const updatePosition = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    // Responsive width: fit viewport with margins
    const panelWidth = Math.min(DROPDOWN_WIDTH, vw - VIEWPORT_MARGIN * 2);

    // Anchor: align right edge of dropdown with right edge of bell
    let left = rect.right - panelWidth;

    // Clamp so panel stays within viewport
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + panelWidth > vw - VIEWPORT_MARGIN) left = vw - VIEWPORT_MARGIN - panelWidth;

    const top = rect.bottom + BELL_OFFSET_Y;

    setPos({ top, left, width: panelWidth });
  }, []);

  // Reposition on open, resize, scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // capture phase for nested scrolls
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside: close if click is outside both bell and dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inBell = bellRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inBell && !inDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markRead({ notificationId: notification._id });
    }
    // Handle navigation based on notification.link or payload
    if (notification.link) {
      if (notification.link.startsWith('/')) {
        // Dispatch custom event for internal navigation
        window.dispatchEvent(new CustomEvent('app-navigate', { 
          detail: { path: notification.link, payload: notification.payload } 
        }));
      } else {
        window.location.href = notification.link;
      }
    }
    setIsOpen(false);
  };

  const dropdown = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 99999,
          }}
          className="bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right"
        >
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[10px] text-white/40 font-bold mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {!notifications || notifications.page.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center opacity-20">
                <Bell size={32} strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-widest mt-4">All caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.page.map((notif: any) => (
                  <div 
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group relative ${!notif.isRead ? 'bg-white/[0.01]' : ''}`}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        {notif.type}
                      </span>
                      <span className="text-[9px] font-bold text-white/20">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className={`text-[13px] font-bold leading-tight mb-1 ${notif.isRead ? 'text-white/60' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification({ notificationId: notif._id });
                      }}
                      className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-center">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors">
              View All Plan Updates
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center press-scale relative"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-white" : "text-white/60"} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#050505] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        )}
      </button>
      {dropdown}
    </div>
  );
};

export default NotificationBell;
