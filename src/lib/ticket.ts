/** Référence lisible d'un ticket d'aide à partir de son identifiant (ex. REV-8A2F9K). */
export function ticketRef(id: string): string {
  return `REV-${id.slice(-6).toUpperCase()}`;
}
