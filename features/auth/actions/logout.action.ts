export const logoutAction = async () => {
  // NestJS Logout-Endpoint aufrufen, der Cookies löscht
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  // Clientseitige Navigation (optional)
  return { success: true };
};
