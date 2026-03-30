import * as z from "zod";

/**
 * Permission schema
 */
export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  guard_name: z.string().default("web"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

/** User summary for role detail */
export const RoleUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});
export type RoleUser = z.infer<typeof RoleUserSchema>;

/**
 * Role schema
 */
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  guard_name: z.string().default("web"),
  permissions: z.array(PermissionSchema).optional(),
  permissions_count: z.number().optional(),
  users_count: z.number().optional(),
  users: z.array(RoleUserSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Role = z.infer<typeof RoleSchema>;

/**
 * Create role schema
 */
export const CreateRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  permissions: z.array(z.string()).optional(),
});

export type CreateRoleData = z.infer<typeof CreateRoleSchema>;

/**
 * Update role schema
 */
export const UpdateRoleSchema = CreateRoleSchema;

export type UpdateRoleData = z.infer<typeof UpdateRoleSchema>;
