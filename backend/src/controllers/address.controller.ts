import { Response, NextFunction } from 'express';
import { Address } from '../models/Address';
import { AuthenticatedRequest } from '../types';

export const addressController = {
  // GET /api/addresses — Fetch all saved addresses for the authenticated user
  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const addresses = await Address.find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/addresses — Create a new text-only delivery address
  async createAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const userId = user._id.toString();

      // Extract & trim inputs
      const houseStreet = typeof req.body.houseStreet === 'string'
        ? req.body.houseStreet.trim()
        : typeof req.body.addressLine1 === 'string'
        ? req.body.addressLine1.trim()
        : '';

      const areaCity = typeof req.body.areaCity === 'string'
        ? req.body.areaCity.trim()
        : typeof req.body.city === 'string'
        ? req.body.city.trim()
        : '';

      const rawPinCode = typeof req.body.pinCode === 'string'
        ? req.body.pinCode.trim()
        : typeof req.body.postalCode === 'string'
        ? req.body.postalCode.trim()
        : '';

      const landmark = typeof req.body.landmark === 'string' ? req.body.landmark.trim() : '';

      const rawLabel = typeof req.body.label === 'string' ? req.body.label.trim() : 'Home';
      const label = ['Home', 'Work', 'Other'].includes(rawLabel) ? rawLabel : 'Home';

      const isDefaultRequested = Boolean(req.body.isDefault);

      // Validation
      const errors: Record<string, string> = {};

      if (!houseStreet) {
        errors.houseStreet = 'House number / street is required';
      } else if (houseStreet.length > 200) {
        errors.houseStreet = 'House number / street must be under 200 characters';
      }

      if (!areaCity) {
        errors.areaCity = 'Area / town / city is required';
      } else if (areaCity.length > 120) {
        errors.areaCity = 'Area / town / city must be under 120 characters';
      }

      if (!rawPinCode) {
        errors.pinCode = 'PIN code is required';
      } else if (!/^\d{6}$/.test(rawPinCode)) {
        errors.pinCode = 'PIN code must be exactly 6 numeric digits';
      }

      if (landmark && landmark.length > 150) {
        errors.landmark = 'Landmark must be under 150 characters';
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          success: false,
          message: Object.values(errors)[0],
          errors,
        });
        return;
      }

      // Check existing count
      const count = await Address.countDocuments({ userId });
      const isDefault = isDefaultRequested || count === 0;

      if (isDefault && count > 0) {
        // Unset any existing default
        await Address.updateMany({ userId }, { isDefault: false });
      }

      const address = await Address.create({
        userId,
        label,
        houseStreet,
        areaCity,
        pinCode: rawPinCode,
        landmark,
        fullName: typeof req.body.fullName === 'string' && req.body.fullName.trim() ? req.body.fullName.trim() : user.name || 'Customer',
        phone: typeof req.body.phone === 'string' && req.body.phone.trim() ? req.body.phone.trim() : user.phone || '',
        addressLine1: houseStreet,
        city: areaCity,
        postalCode: rawPinCode,
        state: typeof req.body.state === 'string' && req.body.state.trim() ? req.body.state.trim() : 'Tamil Nadu',
        isDefault,
      });

      res.status(201).json({
        success: true,
        data: address,
        message: 'Delivery address added successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/addresses/:id — Edit an existing address
  async updateAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const address = await Address.findOne({ _id: req.params.id, userId });

      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
        return;
      }

      // Extract & trim inputs
      const houseStreet = typeof req.body.houseStreet === 'string'
        ? req.body.houseStreet.trim()
        : typeof req.body.addressLine1 === 'string'
        ? req.body.addressLine1.trim()
        : address.houseStreet || address.addressLine1;

      const areaCity = typeof req.body.areaCity === 'string'
        ? req.body.areaCity.trim()
        : typeof req.body.city === 'string'
        ? req.body.city.trim()
        : address.areaCity || address.city;

      const rawPinCode = typeof req.body.pinCode === 'string'
        ? req.body.pinCode.trim()
        : typeof req.body.postalCode === 'string'
        ? req.body.postalCode.trim()
        : address.pinCode || address.postalCode;

      const landmark = typeof req.body.landmark === 'string'
        ? req.body.landmark.trim()
        : address.landmark || '';

      const rawLabel = typeof req.body.label === 'string' ? req.body.label.trim() : address.label || 'Home';
      const label = ['Home', 'Work', 'Other'].includes(rawLabel) ? rawLabel : address.label || 'Home';

      // Validation
      const errors: Record<string, string> = {};

      if (!houseStreet) {
        errors.houseStreet = 'House number / street cannot be empty';
      } else if (houseStreet.length > 200) {
        errors.houseStreet = 'House number / street must be under 200 characters';
      }

      if (!areaCity) {
        errors.areaCity = 'Area / town / city cannot be empty';
      } else if (areaCity.length > 120) {
        errors.areaCity = 'Area / town / city must be under 120 characters';
      }

      if (!rawPinCode) {
        errors.pinCode = 'PIN code cannot be empty';
      } else if (!/^\d{6}$/.test(rawPinCode)) {
        errors.pinCode = 'PIN code must be exactly 6 numeric digits';
      }

      if (landmark && landmark.length > 150) {
        errors.landmark = 'Landmark must be under 150 characters';
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json({
          success: false,
          message: Object.values(errors)[0],
          errors,
        });
        return;
      }

      if (req.body.isDefault === true && !address.isDefault) {
        await Address.updateMany({ userId }, { isDefault: false });
        address.isDefault = true;
      }

      address.label = label as 'Home' | 'Work' | 'Other';
      address.houseStreet = houseStreet;
      address.areaCity = areaCity;
      address.pinCode = rawPinCode;
      address.landmark = landmark;
      address.addressLine1 = houseStreet;
      address.city = areaCity;
      address.postalCode = rawPinCode;

      if (typeof req.body.fullName === 'string' && req.body.fullName.trim()) {
        address.fullName = req.body.fullName.trim();
      }
      if (typeof req.body.phone === 'string' && req.body.phone.trim()) {
        address.phone = req.body.phone.trim();
      }

      await address.save();

      res.json({
        success: true,
        data: address,
        message: 'Address updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/addresses/:id — Delete saved address
  async deleteAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const address = await Address.findOneAndDelete({ _id: req.params.id, userId });

      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
        return;
      }

      // If deleted was default, promote next address
      if (address.isDefault) {
        const nextAddr = await Address.findOne({ userId }).sort({ createdAt: -1 });
        if (nextAddr) {
          nextAddr.isDefault = true;
          await nextAddr.save();
        }
      }

      res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/addresses/:id/default — Set address as default
  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await Address.updateMany({ userId }, { isDefault: false });

      const address = await Address.findOneAndUpdate(
        { _id: req.params.id, userId },
        { isDefault: true },
        { returnDocument: 'after' }
      );

      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found' });
        return;
      }

      res.json({
        success: true,
        data: address,
        message: 'Default delivery address updated',
      });
    } catch (error) {
      next(error);
    }
  },
};
