// services/notificationService.ts
import { Notification, Role } from '../types';
import { mockNotifications, mockUsers } from '../data/mockData';

const notifications: Notification[] = [...mockNotifications];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    await delay(300);
    return [...notifications]
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const markAsRead = async (notificationId: string, userId: string): Promise<Notification | undefined> => {
    await delay(100);
    const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notification) {
        notification.isRead = true;
    }
    return notification;
};

export const markAllAsRead = async (userId: string): Promise<Notification[]> => {
    await delay(200);
    const userNotifications = notifications.filter(n => n.userId === userId);
    userNotifications.forEach(n => n.isRead = true);
    return userNotifications;
};

export const sendBroadcast = async (message: string, targetGroup: Role): Promise<void> => {
    await delay(500);
    const targetUsers = mockUsers.filter(u => u.role === targetGroup);
    
    targetUsers.forEach(user => {
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${user.id}`,
            userId: user.id,
            message: `Comunicado: ${message}`,
            isRead: false,
            createdAt: new Date(),
            type: 'announcement',
        };
        notifications.unshift(newNotification);
    });
};