export interface CurrentSpot {
  userSpot: number;
  eventName: string;
  currentSpot: number;
  waitingTime: Date;
  location: string;
  // optional fields that may come from the API (snake_case or alternate names)
  spot_number?: number;
  current_spot?: number;
  waiting_time?: string | Date;
  turn_id?: number;
  turnId?: number;
  user_spot?: number;
}

export interface RegisteredSpot {
  id: number;
  userSpot: number;
  eventName: string;
  startDate: Date;
}

export interface UnregisteredSpot {
  id: number;
  eventName: string;
  startDate: Date;
  endDate: Date;
  location: string;
}
