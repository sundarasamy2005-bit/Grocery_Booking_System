import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { Shop } from '../models/Shop';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../types';
import { uploadService } from '../services/upload.service';
import { createError } from '../middleware/error.middleware';

function sanitizeShopData(raw: Record<string, any>, isUserAdmin: boolean = false) {
  const data = { ...raw };
  if (!isUserAdmin) {
    delete data.isApproved;
  }

  // Coordinates
  if (data.latitude !== undefined && data.latitude !== '') {
    const lat = Number(data.latitude);
    if (!isNaN(lat)) data.latitude = lat;
  }
  if (data.longitude !== undefined && data.longitude !== '') {
    const lng = Number(data.longitude);
    if (!isNaN(lng)) data.longitude = lng;
  }

  // Numerical properties
  if (data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== '') {
    data.minimumOrderAmount = Math.max(0, Number(data.minimumOrderAmount) || 0);
  }
  if (data.deliveryFee !== undefined && data.deliveryFee !== '') {
    data.deliveryFee = Math.max(0, Number(data.deliveryFee) || 0);
  }
  if (data.freeDeliveryThreshold !== undefined && data.freeDeliveryThreshold !== '') {
    data.freeDeliveryThreshold = Math.max(0, Number(data.freeDeliveryThreshold) || 0);
  }
  if (data.estimatedDeliveryTime !== undefined && data.estimatedDeliveryTime !== '') {
    data.estimatedDeliveryTime = Math.max(5, Number(data.estimatedDeliveryTime) || 30);
  }

  // Boolean flags (cast correctly from multipart/form-data strings)
  if (data.deliveryAvailable !== undefined) {
    data.deliveryAvailable = data.deliveryAvailable === true || data.deliveryAvailable === 'true';
  }
  if (data.pickupAvailable !== undefined) {
    data.pickupAvailable = data.pickupAvailable === true || data.pickupAvailable === 'true';
  }
  if (data.isOpen !== undefined) {
    data.isOpen = data.isOpen === true || data.isOpen === 'true';
  }
  if (data.isActive !== undefined) {
    data.isActive = data.isActive === true || data.isActive === 'true';
  }

  // Operating Days array
  if (data.operatingDays !== undefined) {
    if (typeof data.operatingDays === 'string') {
      try {
        const parsed = JSON.parse(data.operatingDays);
        data.operatingDays = Array.isArray(parsed) ? parsed : [data.operatingDays];
      } catch {
        data.operatingDays = data.operatingDays.split(',').map((d: string) => d.trim()).filter(Boolean);
      }
    }
  }

  return data;
}

// Haversine distance formula (in km)
const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const shopController = {
  // GET /api/shops — public list with nearby sort
  async getShops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        search = '',
        lat,
        lng,
        city,
      } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build filter
      const filter: Record<string, unknown> = { isApproved: true, isActive: true };
      if (search) {
        filter.$or = [
          { shopName: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
        ];
      }
      if (city) filter.city = { $regex: city, $options: 'i' };

      const total = await Shop.countDocuments(filter);
      let shops = await Shop.find(filter)
        .select('-__v')
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Add distance if coordinates provided
      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const shopsWithDist = shops
          .map((shop) => ({
            ...shop,
            distance: haversineDistance(userLat, userLng, shop.latitude, shop.longitude),
          }))
          .sort((a, b) => a.distance - b.distance);

        res.json({
          success: true,
          data: shopsWithDist,
          pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
        return;
      }

      res.json({
        success: true,
        data: shops,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/shops/:id
  async getShopById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shop = await Shop.findById(req.params.id).select('-__v').lean();
      if (!shop) {
        res.status(404).json({ success: false, message: 'Shop not found' });
        return;
      }
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/shops — shop owner creates shop
  async createShop(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;

      const existing = await Shop.findOne({ ownerId: user._id.toString() });
      if (existing) {
        const updateData = sanitizeShopData(req.body, user.role === 'admin');
        if (req.file) {
          try {
            const result = await uploadService.uploadShopImage(req.file.buffer, req.file.mimetype);
            updateData.shopImage = result.url;
          } catch (uploadErr) {
            console.warn('Shop image upload failed:', uploadErr);
          }
        }
        Object.assign(existing, updateData);
        await existing.save();
        res.status(200).json({
          success: true,
          data: existing,
          message: 'Shop updated successfully',
        });
        return;
      }

      const shopData: Record<string, any> = {
        ...sanitizeShopData(req.body, user.role === 'admin'),
        ownerId: user._id.toString(),
        isApproved: false,
        isActive: true,
      };

      if (req.file) {
        try {
          const result = await uploadService.uploadShopImage(req.file.buffer, req.file.mimetype);
          shopData.shopImage = result.url;
        } catch (uploadErr) {
          console.warn('Shop image upload failed:', uploadErr);
        }
      }

      const shop = await Shop.create(shopData);

      res.status(201).json({
        success: true,
        data: shop,
        message: 'Shop created successfully. Awaiting admin approval.',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/shops/:id — shop owner updates their shop
  async updateShop(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const shop = await Shop.findById(req.params.id);

      if (!shop) {
        res.status(404).json({ success: false, message: 'Shop not found' });
        return;
      }

      // Only owner or admin can update
      if (shop.ownerId !== user._id.toString() && user.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Not authorized to update this shop' });
        return;
      }

      const updateData = sanitizeShopData(req.body, user.role === 'admin');

      if (req.file) {
        try {
          const result = await uploadService.uploadShopImage(req.file.buffer, req.file.mimetype);
          updateData.shopImage = result.url;
        } catch (uploadErr) {
          console.warn('Shop image update failed:', uploadErr);
        }
      }

      Object.assign(shop, updateData);
      await shop.save();

      res.json({ success: true, data: shop, message: 'Shop updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/shops/location/search?q=... — proxy Nominatim search to prevent browser CORS/rate limiting
  async searchLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query || query.length < 2) {
        res.json({ success: true, data: [] });
        return;
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'jsonv2',
          addressdetails: 1,
          limit: 8,
        },
        headers: {
          'User-Agent': 'LocalGroceryApp/1.0 (contact@localgrocery.app)',
          'Accept': 'application/json',
        },
        timeout: 6000,
      });

      const formatted = (response.data || []).map((item: any) => ({
        placeId: item.place_id,
        displayName: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.address,
      }));

      res.json({ success: true, data: formatted });
    } catch (error: any) {
      console.warn('Geocoding search proxy warning:', error?.message || error);
      res.json({ success: false, data: [], message: 'Search query could not be completed' });
    }
  },

  // GET /api/shops/location/reverse?lat=...&lng=... — proxy reverse geocode
  async reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng } = req.query as { lat: string; lng: string };
      if (!lat || !lng) {
        res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        return;
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'jsonv2',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'LocalGroceryApp/1.0 (contact@localgrocery.app)',
          'Accept': 'application/json',
        },
        timeout: 6000,
      });

      const data = response.data;
      const addr = data.address || {};
      res.json({
        success: true,
        data: {
          displayName: data.display_name,
          address: addr.road || addr.suburb || addr.neighbourhood || data.display_name?.split(',')[0] || '',
          city: addr.city || addr.town || addr.village || addr.county || '',
          state: addr.state || '',
          postalCode: addr.postcode || '',
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          raw: addr,
        },
      });
    } catch (error: any) {
      console.warn('Reverse geocode proxy warning:', error?.message || error);
      res.status(500).json({ success: false, message: 'Reverse geocode could not be completed' });
    }
  },

  // GET /api/shops/my — get current owner's shop
  async getMyShop(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let shop = await Shop.findOne({ ownerId: req.user!._id.toString() });
      if (!shop && req.user!.role === 'shopOwner') {
        // Automatically create approved initial shop profile if missing
        shop = await Shop.create({
          ownerId: req.user!._id.toString(),
          shopName: `${req.user!.name}'s Grocery Shop`,
          description: `Fresh quality groceries and essentials by ${req.user!.name}`,
          phone: req.user!.phone || '9876543210',
          email: req.user!.email,
          address: 'Main Bazaar',
          city: 'Pollachi',
          state: 'Tamil Nadu',
          postalCode: '642001',
          latitude: 10.6585,
          longitude: 77.0094,
          isApproved: true,
          isActive: true,
          deliveryAvailable: true,
          pickupAvailable: true,
          minimumOrderAmount: 0,
        });
      }
      if (!shop) {
        res.json({ success: true, data: null, message: 'No shop found for your account' });
        return;
      }
      res.json({ success: true, data: shop });
    } catch (error) {
      next(error);
    }
  },
};
