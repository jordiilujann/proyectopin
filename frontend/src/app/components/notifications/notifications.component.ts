import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Notification {
  _id?: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'review';
  message: string;
  read: boolean;
  created_at: string;
  related_review_id?: string;
  related_user_id?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading: boolean = true;
  error: string = '';
  private readonly API_BASE = 'http://127.0.0.1:3000';

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const token = this.auth.getAccessToken();
    const userId = this.auth.getUserId();
    
    if (!token || !userId) {
      this.loading = false;
      this.error = 'No hay sesión iniciada.';
      return;
    }

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Por ahora, cargamos notificaciones del usuario
    // Ajusta la ruta según tu backend
    this.http.get<Notification[]>(`${this.API_BASE}/api/notifications/user/${userId}`, { headers })
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando notificaciones:', err);
          // Si no existe el endpoint, mostramos notificaciones vacías
          this.notifications = [];
          this.loading = false;
          // this.error = 'Error al cargar notificaciones';
        }
      });
  }

  markAsRead(notificationId: string): void {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch(`${this.API_BASE}/api/notifications/${notificationId}/read`, {}, { headers })
      .subscribe({
        next: () => {
          const notification = this.notifications.find(n => n._id === notificationId);
          if (notification) {
            notification.read = true;
          }
        },
        error: (err) => {
          console.error('Error marcando notificación como leída:', err);
        }
      });
  }

  markAllAsRead(): void {
    const token = this.auth.getAccessToken();
    const userId = this.auth.getUserId();
    if (!token || !userId) return;

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch(`${this.API_BASE}/api/notifications/user/${userId}/read-all`, {}, { headers })
      .subscribe({
        next: () => {
          this.notifications.forEach(n => n.read = true);
        },
        error: (err) => {
          console.error('Error marcando todas como leídas:', err);
        }
      });
  }

  deleteNotification(notificationId: string): void {
    const token = this.auth.getAccessToken();
    if (!token) return;

    const headers = new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.delete(`${this.API_BASE}/api/notifications/${notificationId}`, { headers })
      .subscribe({
        next: () => {
          // Eliminar la notificación de la lista local
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
        },
        error: (err) => {
          console.error('Error eliminando notificación:', err);
        }
      });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'review': return '⭐';
      default: return '🔔';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

