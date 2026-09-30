/** Resume a selection after authentication without turning a GET into a save. */
export function selectionReturnPath(setId: string, optionId = "", purchased: string[] = []) {
  const params = new URLSearchParams({set: setId});
  if (optionId) params.set("optionId", optionId);
  const selected = [...new Set(purchased.filter(Boolean))];
  if (selected.length) params.set("purchased", selected.join(","));
  return `/onboarding/select?${params.toString()}`;
}
