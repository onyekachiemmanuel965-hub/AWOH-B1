import { getApiBase } from "./api";

export type LocationOption = {
  id: string;
  code: string;
  name: string;
  stateId?: string;
  lgaId?: string;
};

async function locFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Unable to load locations.");
  }
  return res.json() as Promise<T>;
}

export function fetchStates() {
  return locFetch<LocationOption[]>("/api/v1/locations/states");
}

export function fetchLgas(stateId: string) {
  return locFetch<LocationOption[]>(
    `/api/v1/locations/states/${stateId}/lgas`,
  );
}

export function fetchTowns(lgaId: string) {
  return locFetch<LocationOption[]>(`/api/v1/locations/lgas/${lgaId}/towns`);
}
