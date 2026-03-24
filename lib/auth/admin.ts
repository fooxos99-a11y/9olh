import { forbiddenResponse, unauthorizedResponse } from "@/lib/auth/guards"
import { getSessionFromCookieHeader } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export const ADMIN_ROLES = new Set(["admin", "مدير", "سكرتير", "مشرف تعليمي", "مشرف تربوي", "مشرف برامج"])
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001"

const DEFAULT_ROLE_SETTINGS = {
  roles: ["مدير", "سكرتير", "مشرف تعليمي", "مشرف تربوي", "مشرف برامج"],
  permissions: {
    "مدير": ["all"],
    "سكرتير": [],
    "مشرف تعليمي": [],
    "مشرف تربوي": [],
    "مشرف برامج": [],
  } as Record<string, string[]>,
}

async function getRoleSettings() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("programs")
      .select("description")
      .eq("id", SETTINGS_ID)
      .maybeSingle()

    if (error || !data?.description) {
      return DEFAULT_ROLE_SETTINGS
    }

    const parsed = JSON.parse(data.description)
    return {
      roles: Array.isArray(parsed?.roles) ? parsed.roles : DEFAULT_ROLE_SETTINGS.roles,
      permissions: parsed?.permissions && typeof parsed.permissions === "object"
        ? parsed.permissions as Record<string, string[]>
        : DEFAULT_ROLE_SETTINGS.permissions,
    }
  } catch {
    return DEFAULT_ROLE_SETTINGS
  }
}

export async function requireAdminSession(request: Request, permissionKey?: string) {
  const session = await getSessionFromCookieHeader(request.headers.get("cookie"))

  if (!session) {
    return { response: unauthorizedResponse() }
  }

  if (session.role === "admin") {
    return { session }
  }

  const roleSettings = await getRoleSettings()
  const isKnownAdminRole = ADMIN_ROLES.has(session.role) || roleSettings.roles.includes(session.role)

  if (!isKnownAdminRole) {
    return { response: forbiddenResponse() }
  }

  if (permissionKey && session.role !== "مدير") {
    const rolePermissions = roleSettings.permissions[session.role] || []
    const hasPermission = rolePermissions.includes("all") || rolePermissions.includes(permissionKey)

    if (!hasPermission) {
      return { response: forbiddenResponse() }
    }
  }

  return { session }
}