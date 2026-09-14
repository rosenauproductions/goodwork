import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://127.0.0.1:8090')

export const ensurePocketBaseAuth = async () => {
  if (pb.authStore.isValid) return pb

  try {
    await pb.admins.authWithPassword('admin@goodwork.local', 'change-me-123')
  } catch {
    // Allow the app to run in local-demo mode when no admin is configured yet.
  }

  return pb
}
