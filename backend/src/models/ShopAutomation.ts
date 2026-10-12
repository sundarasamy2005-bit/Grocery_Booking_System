import mongoose, { Document } from 'mongoose';

export interface IShopNotification {
  _id: string;
  title: string;
  message: string;
  type: 'stock_alert' | 'sales_summary' | 'order_update' | 'system';
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
  createdAt: Date;
}

export interface IJobState {
  enabled: boolean;
  intervalHours?: number;
  preferredHour?: number;
  preferredMinute?: number;
  customTime?: string; // Formatted HH:mm string e.g. "21:00"
  dayOfWeek?: number;
  emailNotification?: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastStatus: 'idle' | 'running' | 'success' | 'failed';
  lastError?: string;
}

export interface IShopAutomation extends Document {
  shopId: string;
  notificationEmail?: string; // Target Gmail address for owner notifications
  emailAlertsEnabled: boolean;
  lowStockThreshold: number; // Default 10 units
  lowStockCheck: IJobState;
  dailySalesSummary: IJobState;
  weeklyBusinessReport: IJobState;
  notifications: IShopNotification[];
  createdAt: Date;
  updatedAt: Date;
}

const jobStateSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    intervalHours: { type: Number, default: 6 },
    preferredHour: { type: Number, default: 21 },
    preferredMinute: { type: Number, default: 0 },
    customTime: { type: String, default: '21:00' },
    dayOfWeek: { type: Number, default: 0 },
    emailNotification: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
    lastStatus: {
      type: String,
      enum: ['idle', 'running', 'success', 'failed'],
      default: 'idle',
    },
    lastError: { type: String },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['stock_alert', 'sales_summary', 'order_update', 'system'],
      default: 'stock_alert',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shopAutomationSchema = new mongoose.Schema<IShopAutomation>(
  {
    shopId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: 'Shop',
    },
    notificationEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    emailAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    lowStockCheck: {
      type: jobStateSchema,
      default: () => ({
        enabled: true,
        intervalHours: 6,
        emailNotification: true,
        lastStatus: 'idle',
      }),
    },
    dailySalesSummary: {
      type: jobStateSchema,
      default: () => ({
        enabled: true,
        preferredHour: 21,
        preferredMinute: 0,
        customTime: '21:00',
        emailNotification: true,
        lastStatus: 'idle',
      }),
    },
    weeklyBusinessReport: {
      type: jobStateSchema,
      default: () => ({
        enabled: true,
        dayOfWeek: 0,
        preferredHour: 20,
        preferredMinute: 0,
        customTime: '20:00',
        emailNotification: true,
        lastStatus: 'idle',
      }),
    },
    notifications: {
      type: [notificationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const ShopAutomation = mongoose.model<IShopAutomation>('ShopAutomation', shopAutomationSchema);
