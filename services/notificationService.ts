
import { supabase } from './supabase/supabaseClient';
import { Notification } from '../types';

class NotificationService {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar notificações: ${error.message}`);
    }

    return data || [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Erro ao marcar todas as notificações como lidas: ${error.message}`);
    }
  }

  async sendNotification(userId: string, message: string, type: string): Promise<void> {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        message,
        type,
      },
    ]);

    if (error) {
      throw new Error(`Erro ao enviar notificação: ${error.message}`);
    }
  }

  async sendBroadcast(message: string, type: string, userIds: string[]): Promise<void> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      message,
      type,
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      throw new Error(`Erro ao enviar notificação em massa: ${error.message}`);
    }
  }
}

const notificationServiceInstance = new NotificationService();

// Export individual functions to match namespace import pattern
export const getNotifications = notificationServiceInstance.getNotifications.bind(notificationServiceInstance);
export const markAsRead = notificationServiceInstance.markAsRead.bind(notificationServiceInstance);
export const markAllAsRead = notificationServiceInstance.markAllAsRead.bind(notificationServiceInstance);
export const sendBroadcast = notificationServiceInstance.sendBroadcast.bind(notificationServiceInstance);

// Also export the instance for backward compatibility
export const notificationService = notificationServiceInstance;
