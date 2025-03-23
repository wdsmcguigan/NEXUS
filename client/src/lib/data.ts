import { AccountType, Category, EmailPriority, StarColor } from "@shared/schema";
import { 
  Layers,
  Calendar,
  ClipboardList,
  Folder,
  Users,
  Triangle
} from 'lucide-react';
import React from 'react';

export const starColors: Record<StarColor, string> = {
  red: "text-star-red",
  orange: "text-star-orange",
  gold: "text-star-gold",
  green: "text-star-green",
  blue: "text-star-blue",
  none: "text-neutral-300",
};

export const accountColors: Record<AccountType, string> = {
  work: "bg-primary",
  personal: "bg-green-500",
  school: "bg-purple-500",
};

export const categoryColors: Record<Category, string> = {
  primary: "bg-primary",
  social: "bg-green-500",
  promotions: "bg-yellow-500",
  updates: "bg-blue-500",
};

export const priorityBadgeColors: Record<EmailPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  none: "bg-neutral-300",
};

export const integrations = [
  {
    name: "Slack",
    icon: React.createElement(Layers, { className: "w-6 h-6 text-blue-500" }),
    color: "text-blue-500"
  },
  {
    name: "Calendar",
    icon: React.createElement(Calendar, { className: "w-6 h-6 text-purple-500" }),
    color: "text-purple-500"
  },
  {
    name: "Tasks",
    icon: React.createElement(ClipboardList, { className: "w-6 h-6 text-green-500" }),
    color: "text-green-500"
  },
  {
    name: "Drive",
    icon: React.createElement(Folder, { className: "w-6 h-6 text-red-500" }),
    color: "text-red-500"
  },
  {
    name: "Contacts",
    icon: React.createElement(Users, { className: "w-6 h-6 text-yellow-500" }),
    color: "text-yellow-500"
  },
  {
    name: "Asana",
    icon: React.createElement(Triangle, { className: "w-6 h-6 text-orange-500" }),
    color: "text-orange-500"
  },
];