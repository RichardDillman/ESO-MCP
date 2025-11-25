export interface MundusStone {
  id: string;
  name: string;
  effect: string;
  value?: string;
  description: string;
  location?: string;
  source: string;
  lastUpdated: string;
}

export interface MundusStoneData {
  name: string;
  effect: string;
  value?: string;
  description: string;
  location?: string;
}
