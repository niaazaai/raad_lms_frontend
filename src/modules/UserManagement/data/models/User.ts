import * as z from "zod";
import { RoleSchema } from "./Role";

/**
 * User status enum
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Activate",
  [UserStatus.INACTIVE]: "Suspend",
};

export const UserStatusColors: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "success",
  [UserStatus.INACTIVE]: "secondary",
};

/**
 * User schema
 */
export const UserManagementSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable().optional(),
  email_verified_at: z.string().nullable().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  roles: z.array(RoleSchema).optional(),
  permissions: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserManagement = z.infer<typeof UserManagementSchema>;

/**
 * Create user schema
 */
export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
  roles: z.array(z.string()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

export type CreateUserData = z.infer<typeof CreateUserSchema>;

/**
 * Update user schema
 */
export const UpdateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
  roles: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).refine((data) => !data.password || data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
