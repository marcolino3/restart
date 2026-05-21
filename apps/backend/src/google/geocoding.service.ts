import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GeocodeResponse } from '@googlemaps/google-maps-services-js';

export interface GeocodingAddress {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
}

@Injectable()
export class GeocodingService {
  private readonly client: Client;
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Client();
  }

  async geocode(address: GeocodingAddress): Promise<GeocodingResult | null> {
    const parts = [address.street, address.zip, address.city, address.country]
      .filter(Boolean)
      .join(', ');

    if (!parts) return null;

    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY is not configured');
      return null;
    }

    try {
      const response: GeocodeResponse = await this.client.geocode({
        params: {
          address: parts,
          key: apiKey,
        },
      });

      const result = response.data.results[0];
      if (!result) {
        this.logger.warn(`No geocoding result for: ${parts}`);
        return null;
      }

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      };
    } catch (error) {
      this.logger.error(`Geocoding failed for: ${parts}`, error);
      return null;
    }
  }
}
