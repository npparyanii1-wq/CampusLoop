import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { api } from '../api';

export function useWebSockets() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to the /notifications namespace.
    // Vite proxy handles path mapping to http://localhost:5000/notifications
    const socket = io('/notifications', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to /notifications gateway');
      // Register client mapping with backend rooms
      socket.emit('register', {
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId,
      });
    });

    socket.on('registered', () => {
      console.log('[WebSocket] Registration confirmed by gateway');
    });

    socket.on('booking_status_updated', (data: { bookingId: string; assetName: string; status: string; comment?: string }) => {
      const type = data.status === 'approved' ? 'success' : 'error';
      const detail = data.comment ? ` Comment: "${data.comment}"` : '';
      addToast(type, `📅 Booking for "${data.assetName}" was ${data.status}!${detail}`);
    });

    socket.on('booking_approval_needed', (data: { bookingId: string; assetName: string }) => {
      addToast('info', `🔔 Approval required for booking of "${data.assetName}"`);
    });

    socket.on('study_group_invited', (data: { inviterUserId: string; moduleCode: string; inviterName: string }) => {
      // Auto-invite double-opt-in handler
      const message = `📚 ${data.inviterName} has invited you to study ${data.moduleCode}!`;
      addToast('info', message);

      // We trigger a custom confirmation or show options.
      // To simplify, we can prompt the user via an interactive alert or let them choose to accept/decline.
      if (window.confirm(`${data.inviterName} wants to study ${data.moduleCode} with you. Accept?`)) {
        api.post('/study-groups/respond', {
          moduleCode: data.moduleCode,
          inviterUserId: data.inviterUserId,
          action: 'accepted',
        })
          .then((res: any) => {
            addToast('success', `Matched! Contact email: ${res.email}`);
          })
          .catch((err) => {
            addToast('error', `Failed to respond: ${err.message}`);
          });
      } else {
        api.post('/study-groups/respond', {
          moduleCode: data.moduleCode,
          inviterUserId: data.inviterUserId,
          action: 'declined',
        })
          .then(() => {
            addToast('warning', 'Invitation declined.');
          })
          .catch(() => { });
      }
    });

    socket.on('study_group_accepted', (data: { inviteeName: string; inviteeEmail: string; moduleCode: string }) => {
      addToast('success', `🎉 ${data.inviteeName} accepted your invite for ${data.moduleCode}! Email: ${data.inviteeEmail}`);
    });

    socket.on('study_group_declined', (data: { inviteeName: string; moduleCode: string }) => {
      addToast('warning', `😢 ${data.inviteeName} declined your invite for ${data.moduleCode}.`);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, addToast]);

  return socketRef.current;
}
