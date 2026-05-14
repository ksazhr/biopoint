export interface BioporiPoint {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
